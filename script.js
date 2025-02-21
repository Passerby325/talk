// Gemini API配置
const API_KEY = 'AIzaSyA7JRZ1wssbb07dgTAJ2Ut1t-r0t4bKR4M'; // 替换为你的API密钥
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';


let currentScenario = '';
let currentCharacter = '';
let conversationHistory = [];

// 清理API响应文本
function cleanResponseText(text) {
    // 移除Markdown代码块标记和多余的空白
    return text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
}

// 修改初始化场景函数
async function initializeScenario() {
    try {
        document.getElementById('scenario').innerHTML = '<p>Loading...</p>';
        
        const prompt = `生成一个英语口语练习的场景。
要求：
1. 场景要具体，但描述不会超过三句
2. 角色要简单明确，只需一个角色
请按以下格式返回JSON：
{
    "scene": "场景描述（英文）",
    "character": "角色描述（英文）"
}
示例：
{
    "scene": "在咖啡店里，顾客们正排队点餐，空气中弥漫着咖啡香和和轻柔的背景音乐。（英文）",
    "character": "一位20多岁的友善咖啡师战争柜台后，微笑着为每位顾客服务。 （英文）"
}`;

        const rawResponse = await fetchGeminiResponse(prompt);
        console.log('API原始响应:', rawResponse);
        const cleanedResponse = cleanResponseText(rawResponse);
        console.log('清理后的响应:', cleanedResponse);
        
        try {
            const scenario = JSON.parse(cleanedResponse);
            
            // 验证和处理返回的数据
            if (!scenario.scene || !scenario.character || 
                typeof scenario.scene !== 'string' || 
                typeof scenario.character !== 'string') {
                // 如果格式不正确，尝试提取英文描述中的有效信息
                currentScenario = "加载场景失败，请重试";
                currentCharacter = "未知角色";
                throw new Error('场景数据格式不正确');
            }
            
            currentScenario = scenario.scene;
            currentCharacter = scenario.character;
            
            document.getElementById('scenario').innerHTML = `
                <h3>场景：${currentScenario}</h3>
                <p>对话对象：${currentCharacter}</p>
            `;
        } catch (parseError) {
            console.error('JSON解析失败:', parseError);
            console.log('清理后的响应:', cleanedResponse);
            document.getElementById('scenario').innerHTML = `
                <p style="color: red;">场景格式错误，请重试</p>
                <button onclick="initializeScenario()">重新加载场景</button>
            `;
        }
    } catch (error) {
        console.error('初始化场景失败:', error);
        document.getElementById('scenario').innerHTML = `
            <p style="color: red;">加载场景失败: ${error.message}</p>
            <button onclick="initializeScenario()">重试</button>
        `;
    }
}

// 发送消息
async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    if (!userInput.trim()) return;

    // 添加用户消息到对话界面
    addMessageToConversation(userInput, 'user');
    
    // 检查用户表达
    const checkPrompt = `
        分析以下英语表达是否正确，如果有语法错误或是更适合的讲法请指出。
        同时，请理解说话者想表达的意思，用简单的中文概括。
        回复必须是格式正确的JSON字符串：{
            "isCorrect": boolean,
            "intendedMeaning": "中文说明",
            "correction": "如果有错误，给出修正建议，如果正确则为空"
        }
        用户输入：${userInput}
    `;

    try {
        const rawResponse = await fetchGeminiResponse(checkPrompt);
        const cleanedResponse = cleanResponseText(rawResponse);
        
        try {
            const analysis = JSON.parse(cleanedResponse);
            document.getElementById('meaningCheck').textContent = analysis.intendedMeaning;
            document.getElementById('confirmation').classList.remove('hidden');
            
            if (!analysis.isCorrect) {
                addMessageToConversation(`语法提示：${analysis.correction}`, 'system');
            }
        } catch (parseError) {
            console.error('JSON解析失败:', parseError);
            console.log('清理后的响应:', cleanedResponse);
            addMessageToConversation('抱歉，分析结果格式错误', 'system');
        }
    } catch (error) {
        console.error('分析失败:', error);
        addMessageToConversation('分析失败，请重试', 'system');
    }
}

// 确认表达意思
async function confirmMeaning(isCorrect) {
    document.getElementById('confirmation').classList.add('hidden');
    
    if (!isCorrect) {
        const userIntent = prompt('请用中文说明你想表达的意思：');
        if (userIntent) {
            const correctionPrompt = `
                用户想用英语表达："${userIntent}"
                请提供正确的英语表达方式。
            `;
            
            try {
                const suggestion = await fetchGeminiResponse(correctionPrompt);
                addMessageToConversation(`建议表达：${suggestion}`, 'system');
            } catch (error) {
                console.error('获取建议失败:', error);
            }
        }
    } else {
        // 生成AI回复
        const replyPrompt = `
            基于以下场景和对话历史，扮演角色并生成角色的回复：
            场景：${currentScenario}
            角色：${currentCharacter}
            对话历史：${JSON.stringify(conversationHistory)}
        `;
        
        try {
            const aiReply = await fetchGeminiResponse(replyPrompt);
            addMessageToConversation(aiReply, 'ai');
        } catch (error) {
            console.error('生成回复失败:', error);
        }
    }
    
    document.getElementById('userInput').value = '';
}

// 添加消息到对话界面
function addMessageToConversation(message, type) {
    const conversation = document.getElementById('conversation');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${type}-message`);
    messageDiv.textContent = message;
    conversation.appendChild(messageDiv);
    conversation.scrollTop = conversation.scrollHeight;
    
    // 更新对话历史
    conversationHistory.push({
        type: type,
        content: message
    });
}

// 修改API调用函数
async function fetchGeminiResponse(prompt) {
    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid API response format');
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('API调用失败:', error);
        throw new Error(`API请求失败: ${error.message}`);
    }
}

// 页面加载时初始化场景
window.onload = initializeScenario;

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
        // 清除对话历史
        conversationHistory = [];
        document.getElementById('conversation').innerHTML = '';
        document.getElementById('scenario').innerHTML = '<p>Loading...</p>';
        
        // 检查函数是否可用
        if (typeof getRandomScenario !== 'function') {
            throw new Error('场景生成功能未准备好，请刷新页面');
        }
        
        // 使用预定义数据随机生成场景
        const scenario = getRandomScenario();
        if (!scenario || !scenario.scene || !scenario.character) {
            throw new Error('生成场景数据无效');
        }
        
        currentScenario = scenario.scene;
        currentCharacter = scenario.character;
        
        document.getElementById('scenario').innerHTML = `
            <h3>Scene：${currentScenario}</h3>
            <p>Character：${currentCharacter}</p>
            <p class="hint">点击"换个场景"按钮可以更换场景和对话对象</p>
        `;
    } catch (error) {
        console.error('初始化场景失败:', error);
        document.getElementById('scenario').innerHTML = `
            <p style="color: red;">加载场景失败: ${error.message}</p>
            <button onclick="window.location.reload()">重新加载页面</button>
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
        如果有多个语法点或建议，请分点列出。
        回复必须是格式正确的JSON字符串：{
            "isCorrect": boolean,
            "intendedMeaning": "中文说明",
            "correction": ["改进点1", "改进点2", "..."] // 数组格式，每个元素是一个独立的改进建议
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
            
            if (!analysis.isCorrect && Array.isArray(analysis.correction)) {
                // 分段显示每个语法提示
                const corrections = analysis.correction
                    .map((item, index) => `${index + 1}. ${item}`)
                    .join('\n');
                addMessageToConversation(`语法提示：\n${corrections}`, 'system');
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
                请提供多个可能的正确英语表达方式。
                对每种表达方式进行简要说明。
                回复格式为JSON：
                {
                    "suggestions": [
                        {
                            "expression": "英语表达",
                            "explanation": "解释说明，用中文"
                        }
                    ]
                }
            `;
            
            try {
                const suggestion = await fetchGeminiResponse(correctionPrompt);
                const cleanedSuggestion = cleanResponseText(suggestion);
                const suggestions = JSON.parse(cleanedSuggestion);
                
                if (Array.isArray(suggestions.suggestions)) {
                    const formattedSuggestions = suggestions.suggestions
                        .map((item, index) => 
                            `${index + 1}. ${item.expression}\n   说明：${item.explanation}`
                        )
                        .join('\n\n');
                    
                    addMessageToConversation(`建议表达：\n${formattedSuggestions}`, 'system');
                }
            } catch (error) {
                console.error('获取建议失败:', error);
                addMessageToConversation('抱歉，获取表达建议失败', 'system');
            }
        }
    } else {
        // 生成AI回复
        const replyPrompt = `
            As the character described below, generate a natural English response.
            The character ONLY speaks English and responds as a native English speaker.
            
            Scene: ${currentScenario}
            Character: ${currentCharacter}
            Conversation history: ${JSON.stringify(conversationHistory)}
            
            Generate a natural, conversational English response that:
            1. Fits the character's role and personality
            2. Is appropriate for the scene
            3. Maintains natural conversation flow
            4. Uses common English expressions
            Response should be in plain text, no JSON formatting needed.
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

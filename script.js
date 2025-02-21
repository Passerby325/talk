// Gemini API配置
const API_KEY = 'AIzaSyA7JRZ1wssbb07dgTAJ2Ut1t-r0t4bKR4M'; // 替换为你的API密钥
const API_URL = 'https://generativelanguage.googleapis.com/gemini-pro:generateContent';

let currentScenario = '';
let currentCharacter = '';
let conversationHistory = [];

// 初始化场景
async function initializeScenario() {
    try {
        document.getElementById('scenario').innerHTML = '<p>正在加载场景...</p>';
        
        const prompt = "生成一个随机的对话场景和角色，格式为JSON，包含scene（场景描述）和character（角色描述）";
        const response = await fetchGeminiResponse(prompt);
        const scenario = JSON.parse(response);
        
        currentScenario = scenario.scene;
        currentCharacter = scenario.character;
        
        document.getElementById('scenario').innerHTML = `
            <h3>场景：${currentScenario}</h3>
            <p>对话对象：${currentCharacter}</p>
        `;
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
        分析以下英语表达是否正确，如果有语法错误请指出。
        同时，请理解说话者想表达的意思，用简单的中文概括。
        回复格式为JSON：{
            "isCorrect": boolean,
            "intendedMeaning": "英文说明",
            "correction": "如果有错误，给出修正建议，如果正确则为空"
        }
        用户输入：${userInput}
    `;

    try {
        const response = await fetchGeminiResponse(checkPrompt);
        const analysis = JSON.parse(response);
        
        document.getElementById('meaningCheck').textContent = analysis.intendedMeaning;
        document.getElementById('confirmation').classList.remove('hidden');
        
        if (!analysis.isCorrect) {
            addMessageToConversation(`语法提示：${analysis.correction}`, 'system');
        }
    } catch (error) {
        console.error('分析失败:', error);
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
            基于以下场景和对话历史，生成角色的回复：
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

// 调用Gemini API
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
                }]
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

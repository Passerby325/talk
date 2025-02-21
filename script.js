// Gemini API配置
const API_KEY = 'AIzaSyA7JRZ1wssbb07dgTAJ2Ut1t-r0t4bKR4M'; // 替换为你的API密钥
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

let currentScenario = '';
let currentCharacter = '';
let conversationHistory = [];

// 添加对方主动说话功能
async function characterInitiate() {
    const initiatePrompt = `
        As the character described below, initiate a conversation naturally.
        The character should start the conversation in a way that:
        1. Fits their role and the current scene
        2. Feels natural and appropriate
        3. Invites a response from the user
        4. Uses common English expressions
        
        Scene: ${currentScenario}
        Character: ${currentCharacter}
        
        Generate a natural conversation starter in plain text.
    `;
    
    try {
        const aiInitiation = await fetchGeminiResponse(initiatePrompt);
        addMessageToConversation(aiInitiation, 'ai');
    } catch (error) {
        console.error('生成对话失败:', error);
        addMessageToConversation('抱歉，生成对话失败，请重试', 'system');
    }
}

// 添加主题切换功能
let currentTheme = 'normal';
const themes = ['normal', 'dark', 'eye-care'];
const themeNames = {
    'normal': '正常模式',
    'dark': '黑夜模式',
    'eye-care': '养眼模式'
};

function switchTheme() {
    // 获取当前主题的索引
    const currentIndex = themes.indexOf(currentTheme);
    // 切换到下一个主题
    const nextIndex = (currentIndex + 1) % themes.length;
    currentTheme = themes[nextIndex];
    
    // 更新文档主题
    document.documentElement.setAttribute('data-theme', currentTheme === 'normal' ? '' : currentTheme);
    
    // 更新按钮文字
    document.getElementById('themeSwitcher').textContent = themeNames[currentTheme];
    
    // 保存主题选择到本地存储
    localStorage.setItem('preferred-theme', currentTheme);
}

// 页面加载时恢复保存的主题
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        document.documentElement.setAttribute('data-theme', currentTheme === 'normal' ? '' : currentTheme);
        document.getElementById('themeSwitcher').textContent = themeNames[currentTheme];
    }
});

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
            <p class="hint">点击"换个场景"按钮可以更换场景和对话对象。而点击"自定义"按钮能自定义场景和对话对象。</p>
        `;

        // 角色主动发起对话
        await characterInitiate();
    } catch (error) {
        console.error('初始化场景失败:', error);
        document.getElementById('scenario').innerHTML = `
            <p style="color: red;">加载场景失败: ${error.message}</p>
            <button onclick="window.location.reload()">重新加载页面</button>
        `;
    }
}

// 修改对话框显示/隐藏函数
function showCustomDialog() {
    const dialog = document.getElementById('customDialog');
    dialog.classList.remove('hidden');
    dialog.classList.add('show');
    // 清空之前的输入
    document.getElementById('customScene').value = '';
    document.getElementById('customCharacter').value = '';
}

function hideCustomDialog() {
    const dialog = document.getElementById('customDialog');
    dialog.classList.add('hidden');
    dialog.classList.remove('show');
}

async function applyCustomScenario() {
    const customScene = document.getElementById('customScene').value.trim();
    const customCharacter = document.getElementById('customCharacter').value.trim();
    
    if (!customScene || !customCharacter) {
        alert('请填写场景和对话对象描述');
        return;
    }
    
    try {
        // 清除对话历史
        conversationHistory = [];
        document.getElementById('conversation').innerHTML = '';
        
        // 设置新场景
        currentScenario = customScene;
        currentCharacter = customCharacter;
        
        // 更新显示
        document.getElementById('scenario').innerHTML = `
            <h3>Scene：${currentScenario}</h3>
            <p>Character：${currentCharacter}</p>
            <p class="hint">点击"换个场景"按钮可以更换场景和对话对象</p>
        `;
        
        // 隐藏对话框
        hideCustomDialog();

        // 角色主动发起对话
        await characterInitiate();
    } catch (error) {
        console.error('设置自定义场景失败:', error);
        alert('设置场景失败，请重试');
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
        Analyze this English expression. If there are any grammar errors or better ways to express it, point them out.
        Also, provide a simple Chinese summary and the correct/recommended expression.
        Response must be in this JSON format:
        {
            "isCorrect": boolean,
            "intendedMeaning": "中文说明",
            "correction": ["改进点1", "改进点2", "..."],
            "recommendedExpression": "The correct/better way to express this"
        }
        User input: "${userInput}"
    `;

    try {
        const rawResponse = await fetchGeminiResponse(checkPrompt);
        const cleanedResponse = cleanResponseText(rawResponse);
        
        try {
            const analysis = JSON.parse(cleanedResponse);
            document.getElementById('meaningCheck').textContent = analysis.intendedMeaning;
            document.getElementById('confirmation').classList.remove('hidden');
            
            if (!analysis.isCorrect && Array.isArray(analysis.correction)) {
                const corrections = analysis.correction
                    .map((item, index) => `${index + 1}. ${item}`)
                    .join('\n');
                const message = `语法提示：\n${corrections}\n\n推荐表达：\n"${analysis.recommendedExpression}"`;
                addMessageToConversation(message, 'system');
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

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

// 添加场景信息翻译函数
async function translateScenarioInfo(element, type) {
    const originalText = element.textContent.replace(/^(Scene：|Character：)/, '').trim();
    const existingTranslation = element.querySelector('.translation-text');
    
    if (existingTranslation) {
        existingTranslation.remove();
        return;
    }
    
    try {
        const translationPrompt = `
            Translate the following English text to Chinese. 
            Only provide the direct translation, no explanations:
            "${originalText}"
        `;
        
        const translation = await fetchGeminiResponse(translationPrompt);
        
        const translationSpan = document.createElement('span');
        translationSpan.classList.add('translation-text');
        translationSpan.textContent = ` (${translation.trim()})`;
        element.appendChild(translationSpan);
    } catch (error) {
        console.error('翻译失败:', error);
        alert('翻译失败，请重试');
    }
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
            <div class="scene-info">
                <h3>
                    Scene：${currentScenario}
                    <button class="translate-btn" onclick="translateScenarioInfo(this.parentElement, 'scene')">翻译</button>
                </h3>
                <p>
                    Character：${currentCharacter}
                    <button class="translate-btn" onclick="translateScenarioInfo(this.parentElement, 'character')">翻译</button>
                </p>
                <p class="hint">点击"换个场景"按钮可以更换场景和对话对象。点击"对方主动"按钮让对方开始对话。</p>
            </div>
        `;
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
            <div class="scene-info">
                <h3>
                    Scene：${currentScenario}
                    <button class="translate-btn" onclick="translateScenarioInfo(this.parentElement, 'scene')">翻译</button>
                </h3>
                <p>
                    Character：${currentCharacter}
                    <button class="translate-btn" onclick="translateScenarioInfo(this.parentElement, 'character')">翻译</button>
                </p>
                <p class="hint">点击"换个场景"按钮可以更换场景和对话对象。点击"对方主动"按钮让对方开始对话。</p>
            </div>
        `;
        
        // 隐藏对话框
        hideCustomDialog();
    } catch (error) {
        console.error('设置自定义场景失败:', error);
        alert('设置场景失败，请重试');
    }
}

// 发送消息
async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    if (!userInput.trim()) return;

    addMessageToConversation(userInput, 'user');
    
    const checkPrompt = `
        Analyze this English expression and provide feedback in JSON format.
        Check for grammar, expression style, and politeness level.
        All explanations must be in English.
        For better expressions, provide exactly one formal and one casual alternative.
        
        Response format:
        {
            "isCorrect": boolean,
            "intendedMeaning": "用中文解释用户的意图",
            "grammarErrors": [
                {
                    "error": "The actual error",
                    "correction": "The correction",
                    "explanation": "Brief explanation in English"
                }
            ],
            "politenessCheck": {
                "isPolite": boolean,
                "issues": ["Description of politeness issues if any"],
                "politeAlternative": "More polite way to express the same thing"
            },
            "betterExpressions": {
                "formal": {
                    "expression": "A more formal expression",
                    "explanation": "Usage explanation in English"
                },
                "casual": {
                    "expression": "A more casual/natural expression",
                    "explanation": "Usage explanation in English"
                }
            }
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
            
            if (!analysis.isCorrect || !analysis.politenessCheck.isPolite) {
                let message = '';
                
                // 显示语法错误
                if (analysis.grammarErrors && analysis.grammarErrors.length > 0) {
                    message += `Grammar Errors:\n${analysis.grammarErrors.map((err, i) => 
                        `${i + 1}. Found "${err.error}" - Should be "${err.correction}"\n   ${err.explanation}`
                    ).join('\n\n')}\n\n`;
                }
                
                // 显示礼貌程度问题
                if (!analysis.politenessCheck.isPolite) {
                    message += `Politeness Issues:\n${analysis.politenessCheck.issues.join('\n')}\n`;
                    message += `Polite Alternative:\n"${analysis.politenessCheck.politeAlternative}"\n\n`;
                }
                
                // 显示更好的表达方式
                const { formal, casual } = analysis.betterExpressions;
                if (formal || casual) {
                    if (formal) {
                        message += `Formal Expression:\n"${formal.expression}"\nExplanation: ${formal.explanation}\n\n`;
                    }
                    
                    if (casual) {
                        message += `Casual Expression:\n"${casual.expression}"\nExplanation: ${casual.explanation}`;
                    }
                }
                
                if (message.trim()) {
                    addMessageToConversation(message, 'system');
                }
            }
            
        } catch (parseError) {
            console.error('JSON解析失败:', parseError);
            console.log('清理后的响应:', cleanedResponse);
            addMessageToConversation('Sorry, failed to parse the analysis result', 'system');
        }
    } catch (error) {
        console.error('分析失败:', error);
        addMessageToConversation('Analysis failed, please try again', 'system');
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

// 在 addMessageToConversation 函数中修改消息添加逻辑
function addMessageToConversation(message, type) {
    const conversation = document.getElementById('conversation');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${type}-message`);
    
    // 创建消息文本元素
    const messageText = document.createElement('div');
    messageText.textContent = message;
    messageDiv.appendChild(messageText);
    
    // 添加翻译按钮
    const translateBtn = document.createElement('button');
    translateBtn.classList.add('translate-btn');
    translateBtn.textContent = '翻译';
    translateBtn.onclick = () => translateMessage(messageText, messageDiv);
    messageDiv.appendChild(translateBtn);
    
    conversation.appendChild(messageDiv);
    conversation.scrollTop = conversation.scrollHeight;
    
    // 更新对话历史
    conversationHistory.push({
        type: type,
        content: message
    });
}

// 添加翻译消息的函数
async function translateMessage(messageElement, container) {
    const originalText = messageElement.textContent;
    
    // 检查是否已经有翻译
    const existingTranslation = container.querySelector('.translation-message');
    if (existingTranslation) {
        existingTranslation.remove();
        return;
    }
    
    try {
        const translationPrompt = `
            Translate the following English text to Chinese. 
            Only provide the direct translation, no explanations:
            "${originalText}"
        `;
        
        const translation = await fetchGeminiResponse(translationPrompt);
        
        // 创建翻译消息元素
        const translationDiv = document.createElement('div');
        translationDiv.classList.add('translation-message');
        translationDiv.textContent = translation.trim();
        
        // 将翻译插入到原消息之后
        container.appendChild(translationDiv);
        
        // 滚动到新内容
        const conversation = document.getElementById('conversation');
        conversation.scrollTop = conversation.scrollHeight;
    } catch (error) {
        console.error('翻译失败:', error);
        alert('翻译失败，请重试');
    }
}

// 修改API调用函数
async function fetchGeminiResponse(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

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
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // 等待一小段时间以确保消息通道保持打开
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid API response format');
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        console.error('API调用失败:', error);
        throw new Error(`API请求失败: ${error.message}`);
    }
}

// 在 window.onload 中添加事件监听
window.onload = function() {
    initializeScenario();
    
    // 添加输入框自动调整高度
    const userInput = document.getElementById('userInput');
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
};
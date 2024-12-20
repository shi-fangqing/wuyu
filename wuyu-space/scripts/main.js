// 页面切换功能
function showSection(sectionId) {
    // 隐藏所有部分
    document.getElementById('chatSection').style.display = 'none';
    document.getElementById('chatDemo').style.display = 'none';

    // 显示选中部分
    if (sectionId === 'chat') {
        document.getElementById('chatSection').style.display = 'block';
        document.getElementById('chatDemo').style.display = 'block';
    }
}

// 聊天功能
document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendMessage');

    // 存储对话历史
    let messageHistory = [];

    // 发送消息到智谱AI
    async function sendToZhipu(message) {
        const API_KEY = 'e4bd6069bec98b06eaa3420a8cf43fbd.aQtaH8KnMwOFM2ar';
        const url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
        
        // 添加用户消息到历史
        messageHistory.push({
            role: 'user',
            content: message
        });

        // 显示思考状态
        const thinkingMessage = appendMessage('assistant', '思考中...');
        thinkingMessage.classList.add('thinking');

        const requestBody = {
            model: "glm-4",
            messages: messageHistory,
            temperature: 0.7,
            top_p: 0.7,
            max_tokens: 2048,
            request_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        try {
            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`,
                    'X-Timestamp': timestamp.toString()
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API请求失败: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;

            // 添加助手回复到历史
            if (assistantMessage) {
                messageHistory.push({
                    role: 'assistant',
                    content: assistantMessage
                });
                // 移除思考状态消息并显示回复
                thinkingMessage.remove();
                appendMessage('assistant', assistantMessage);
            }

        } catch (error) {
            console.error('请求失败:', error);
            // 移除思考状态消息并显示错误
            thinkingMessage.remove();
            appendMessage('assistant', '抱歉，我遇到了一些问题，请稍后再试。');
        }
    }


    // 发送消息
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // 添加用户消息，使用 white-space: pre-wrap 保留换行
        appendMessage('user', message);
        userInput.value = '';

        // 发送到智谱AI
        sendToZhipu(message);
    }

    // 添加消息到聊天框
    function appendMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.innerHTML = `
            <div class="avatar">${role === 'user' ? '👤' : '🤖'}</div>
            <div class="content">${content.replace(/\n/g, '<br>')}</div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageDiv;
    }

    // 更新助手消息
    function updateAssistantMessage(content) {
        let messageDiv = chatMessages.querySelector('.message.assistant:last-child');
        if (!messageDiv) {
            messageDiv = appendMessage('assistant', '');
        }
        messageDiv.querySelector('.content').innerHTML = marked.parse(content);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 发送按钮点击事件
    sendButton.addEventListener('click', sendMessage);

    // 输入框键盘事件
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});
 
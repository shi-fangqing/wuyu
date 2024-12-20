// 文章列表功能
document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.querySelector('.posts-grid');
    const modal = document.getElementById('postModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const tagsFilter = document.querySelector('.tags-filter');
    const searchInput = document.getElementById('globalSearch');
    let currentTag = 'all';
    let posts = [];
    let filteredPosts = [];

    // 搜索功能
    function searchPosts(keyword) {
        if (!keyword.trim()) {
            filteredPosts = posts;
        } else {
            keyword = keyword.toLowerCase();
            filteredPosts = posts.filter(post => {
                const titleMatch = post.title.toLowerCase().includes(keyword);
                const tagsMatch = post.tags.some(tag => 
                    tag.toLowerCase().includes(keyword)
                );
                return titleMatch || tagsMatch;
            });
        }
        renderPosts(currentTag);
    }

    // 监听搜索输入
    searchInput.addEventListener('input', (e) => {
        searchPosts(e.target.value);
    });

    // 渲染文章列表
    function renderPosts(tag = 'all') {
        const displayPosts = tag === 'all' 
            ? filteredPosts 
            : filteredPosts.filter(post => post.tags.includes(tag));

        postsGrid.innerHTML = displayPosts.map(post => `
            <article class="post-card" data-id="${post.id}">
                <h3>${highlightSearchText(post.title, searchInput.value)}</h3>
                <p class="excerpt">${post.excerpt}</p>
                <div class="post-meta">
                    <span class="date">${post.date}</span>
                    <div class="tags">
                        ${post.tags.map(tag => `
                            <span class="tag">${highlightSearchText(tag, searchInput.value)}</span>
                        `).join('')}
                    </div>
                </div>
            </article>
        `).join('');

        // 添加点击事件
        document.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', () => {
                const postId = card.dataset.id;
                const post = posts.find(p => p.id === postId);
                showPostDetail(post);
            });
        });

        // 如果没有搜索结果，显示提示
        if (displayPosts.length === 0) {
            postsGrid.innerHTML = `
                <div class="no-results">
                    <p>没有找到匹配的文章</p>
                </div>
            `;
        }
    }

    // 高亮搜索关键词
    function highlightSearchText(text, keyword) {
        if (!keyword.trim()) return text;
        const regex = new RegExp(`(${keyword})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // 标签筛选
    tagsFilter.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
            const tag = e.target.dataset.tag;
            currentTag = tag;
            
            // 更新标签激活状态
            document.querySelectorAll('.tags-filter .tag').forEach(tag => {
                tag.classList.remove('active');
            });
            e.target.classList.add('active');

            // 重新渲染文章列表
            renderPosts(tag);
        }
    });

    // 加载文章列表
    async function loadPosts() {
        try {
            // 获取 md 文件列表
            const response = await fetch('../../assets/file/md/');
            if (!response.ok) throw new Error('Failed to fetch file list');
            
            const files = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(files, 'text/html');
            const mdFiles = Array.from(doc.querySelectorAll('a'))
                .filter(a => a.href.endsWith('.md'))
                .map(a => a.href);

            // 加载每个 md 文件的内容
            posts = await Promise.all(mdFiles.map(async (fileUrl) => {
                const fileName = fileUrl.split('/').pop();
                const fileResponse = await fetch(`../../assets/file/md/${fileName}`);
                if (!fileResponse.ok) throw new Error(`Failed to fetch ${fileName}`);
                
                const content = await fileResponse.text();
                const { title, date, tags, excerpt, cleanContent } = parseMetadata(content);
                
                return {
                    id: fileName.replace('.md', ''),
                    title: title || fileName.replace('.md', ''),
                    content: cleanContent,
                    date: date || new Date().toISOString().split('T')[0],
                    tags: tags || ['未分类'],
                    excerpt: excerpt || cleanContent.slice(0, 200) + '...'
                };
            }));

            // 初始化过滤后的文章列表
            filteredPosts = posts;

            // 更新标签过滤器
            updateTagsFilter();
            // 渲染文章列表
            renderPosts();

        } catch (error) {
            console.error('Error loading posts:', error);
            postsGrid.innerHTML = '<p class="error">加载文章失败，请稍后再试。</p>';
        }
    }

    // 从 markdown 内容中解析元数据和正文
    function parseMetadata(content) {
        const metadata = {};
        const lines = content.split('\n');
        let inMetadata = false;
        let mainContent = [];
        let contentStarted = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.trim() === '---') {
                if (!inMetadata) {
                    inMetadata = true;
                    continue;
                } else {
                    inMetadata = false;
                    continue;
                }
            }

            if (inMetadata) {
                const [key, ...values] = line.trim().split(':');
                if (key && values.length) {
                    let value = values.join(':').trim();
                    if (key === 'tags') {
                        value = value.split(',').map(tag => tag.trim());
                    }
                    metadata[key.trim()] = value;
                }
            } else {
                // 跳过文章开头的标题、日期和标签信息
                if (!contentStarted) {
                    if (line.trim().startsWith('# ') || 
                        line.trim().match(/^日期:|^标签:|^tags:/i) || 
                        line.trim().length === 0) {
                        continue;
                    }
                    contentStarted = true;
                }
                mainContent.push(line);
            }
        }

        // 如果没有元数据，尝试从内容中提取
        if (!metadata.title) {
            const titleMatch = content.match(/^#\s+(.+)$/m);
            if (titleMatch) metadata.title = titleMatch[1];
        }

        if (!metadata.excerpt) {
            metadata.excerpt = mainContent.join(' ')
                .replace(/#/g, '')
                .replace(/^\s*[-*]\s+/gm, '') // 移除列表标记
                .trim()
                .slice(0, 200) + '...';
        }

        // 返回元数据和保留格式的正文内容
        return {
            ...metadata,
            cleanContent: mainContent.join('\n')
        };
    }

    // 更新标签过滤器
    function updateTagsFilter() {
        const allTags = new Set();
        posts.forEach(post => {
            post.tags.forEach(tag => allTags.add(tag));
        });

        tagsFilter.innerHTML = `
            <span class="tag active" data-tag="all">全部</span>
            ${Array.from(allTags).map(tag => 
                `<span class="tag" data-tag="${tag}">${tag}</span>`
            ).join('')}
        `;
    }

    // 显示文章详情
    function showPostDetail(post) {
        const modalTitle = modal.querySelector('.post-title');
        const modalDate = modal.querySelector('.date');
        const modalTags = modal.querySelector('.tags');
        const modalContent = modal.querySelector('.post-content');

        modalTitle.textContent = post.title;
        modalDate.textContent = post.date;
        modalTags.innerHTML = post.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        modalContent.innerHTML = marked.parse(post.content);

        modal.classList.add('active');
    }

    // 关闭模态框
    function closeModal() {
        modal.classList.remove('active');
    }

    // 点击关闭按钮关闭模态框
    closeModalBtn.addEventListener('click', closeModal);

    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // 初始化
    loadPosts();
}); 
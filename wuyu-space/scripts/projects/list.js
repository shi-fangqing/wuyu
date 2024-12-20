// 项目列表功能
document.addEventListener('DOMContentLoaded', () => {
    const projectsGrid = document.querySelector('.projects-grid');
    const modal = document.getElementById('projectModal');
    const closeModalBtn = document.querySelector('.close-modal');

    // 项目数据
    const projects = [
        // 项目数据已清空，等待添加新项目
    ];

    // 渲染项目列表
    function renderProjects() {
        if (!projects || projects.length === 0) {
            projectsGrid.innerHTML = `
                <div class="no-projects">
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" class="empty-icon">
                            <path d="M13 13h-2V7h2v6zm0 4h-2v-2h2v2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                        </svg>
                        <p>暂无项目</p>
                        <p class="sub-text">敬请期待...</p>
                    </div>
                </div>
            `;
            return;
        }

        projectsGrid.innerHTML = projects.map(project => `
            <article class="project-card" data-id="${project.id}">
                <div class="project-thumbnail">
                    <img src="${project.thumbnail}" alt="${project.title}">
                </div>
                <div class="project-info">
                    <h3>${project.title}</h3>
                    <p class="description">${project.description}</p>
                    <div class="tech-stack">
                        ${project.techStack.map(tech => `
                            <span class="tech">${tech}</span>
                        `).join('')}
                    </div>
                    <span class="date">${project.date}</span>
                </div>
            </article>
        `).join('');

        // 添加点击事件
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                const projectId = card.dataset.id;
                const project = projects.find(p => p.id === projectId);
                showProjectDetail(project);
            });
        });
    }

    // 显示项目详情
    function showProjectDetail(project) {
        const modalTitle = modal.querySelector('.project-title');
        const modalDate = modal.querySelector('.date');
        const modalTechStack = modal.querySelector('.tech-stack');
        const modalContent = modal.querySelector('.project-content');
        const demoLink = modal.querySelector('.demo-link');
        const githubLink = modal.querySelector('.github-link');

        modalTitle.textContent = project.title;
        modalDate.textContent = project.date;
        modalTechStack.innerHTML = project.techStack.map(tech => 
            `<span class="tech">${tech}</span>`
        ).join('');
        modalContent.innerHTML = marked.parse(project.details);
        
        demoLink.href = project.demoUrl;
        githubLink.href = project.githubUrl;

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
    renderProjects();
}); 
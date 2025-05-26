// 初始化文章數據
let posts = JSON.parse(localStorage.getItem('blog-posts')) || [];

// 頁面載入時顯示所有文章
document.addEventListener('DOMContentLoaded', () => {
    showAllPosts();
    
    // 註冊發表文章表單提交事件
    document.getElementById('post-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitNewPost();
    });
});

// 顯示所有文章
function showAllPosts() {
    const postsContainer = document.getElementById('posts-container');
    document.getElementById('new-post-form').style.display = 'none';
    postsContainer.style.display = 'block';
    
    // 依照日期排序，最新的在前面
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    postsContainer.innerHTML = posts.map(post => `
        <div class="post-card">
            <h2 class="post-title">${escapeHtml(post.title)}</h2>
            <div class="post-content">${formatContent(post.content)}</div>
            <div class="post-date">${new Date(post.date).toLocaleString('zh-TW')}</div>
        </div>
    `).join('');
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<div class="alert alert-info">還沒有任何文章，來發表第一篇吧！</div>';
    }
}

// 顯示發表新文章表單
function showNewPostForm() {
    document.getElementById('posts-container').style.display = 'none';
    document.getElementById('new-post-form').style.display = 'block';
    document.getElementById('post-form').reset();
}

// 提交新文章
function submitNewPost() {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    
    if (!title || !content) return;
    
    const newPost = {
        id: Date.now(),
        title,
        content,
        date: new Date().toISOString()
    };
    
    posts.unshift(newPost);
    localStorage.setItem('blog-posts', JSON.stringify(posts));
    
    showAllPosts();
}

// HTML 轉義函數，防止 XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 格式化文章內容，將換行符轉換為 <br>
function formatContent(content) {
    return escapeHtml(content).replace(/\n/g, '<br>');
}
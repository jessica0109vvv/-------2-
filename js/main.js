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

    // 註冊圖片預覽功能
    document.getElementById('post-image').addEventListener('change', previewImage);
});

// 顯示所有文章
function showAllPosts() {
    const postsContainer = document.getElementById('posts-container');
    document.getElementById('new-post-form').style.display = 'none';
    postsContainer.style.display = 'block';
    
    // 依照日期排序，最新的在前面
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    postsContainer.innerHTML = posts.map(post => `
        <div class="post-card" data-post-id="${post.id}">
            <h2 class="post-title">${escapeHtml(post.title)}</h2>
            <div class="post-content">${formatContent(post.content)}</div>
            ${post.image ? `<img src="${post.image}" class="post-image">` : ''}
            <div class="post-date">${new Date(post.date).toLocaleString('zh-TW')}</div>
            <div class="post-actions mt-3">
                <button class="btn btn-outline-danger btn-sm me-2 like-btn ${post.liked ? 'active' : ''}" onclick="toggleLike(${post.id})">
                    <i class="fas fa-heart"></i> 
                    <span class="like-count">${post.likes || 0}</span>
                </button>
                <button class="btn btn-outline-primary btn-sm me-2 favorite-btn ${post.favorited ? 'active' : ''}" onclick="toggleFavorite(${post.id})">
                    <i class="fas fa-star"></i>
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="quotePost(${post.id})">
                    <i class="fas fa-quote-right"></i> 引用
                </button>
            </div>
            ${renderCommentSection(post)}
        </div>
    `).join('');
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<div class="alert alert-info">還沒有任何文章，來發表第一篇吧！</div>';
        return;
    }

    // 為每個文章的留言表單添加事件監聽器
    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', handleCommentSubmit);
    });
}

// 切換愛心狀態
function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    post.liked = !post.liked;
    post.likes = (post.likes || 0) + (post.liked ? 1 : -1);
    
    localStorage.setItem('blog-posts', JSON.stringify(posts));
    showAllPosts();
}

// 切換收藏狀態
function toggleFavorite(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    post.favorited = !post.favorited;
    
    localStorage.setItem('blog-posts', JSON.stringify(posts));
    showAllPosts();
}

// 引用文章
function quotePost(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    // 顯示發文表單
    showNewPostForm();
    
    // 預填引用內容
    document.getElementById('post-title').value = `Re: ${post.title}`;
    document.getElementById('post-content').value = 
        `引用自 ${new Date(post.date).toLocaleString('zh-TW')} 的文章：\n\n` +
        `> ${post.content.split('\n').join('\n> ')}\n\n`;
}

// 顯示發表新文章表單
function showNewPostForm() {
    const postsContainer = document.getElementById('posts-container');
    const newPostForm = document.getElementById('new-post-form');
    
    // 隱藏文章列表
    postsContainer.style.display = 'none';
    // 顯示發文表單
    newPostForm.style.display = 'block';
    
    // 清空表單內容
    document.getElementById('post-form').reset();
    document.getElementById('image-preview').innerHTML = '';
}

// 預覽上傳的圖片
function previewImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('請上傳圖片檔案');
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const preview = document.getElementById('image-preview');
        preview.innerHTML = `<img src="${event.target.result}" class="image-preview">`;
    };
    reader.readAsDataURL(file);
}

// 渲染留言區塊
function renderCommentSection(post) {
    const template = document.getElementById('comment-section-template');
    const commentSection = template.content.cloneNode(true);
    const commentsContainer = commentSection.querySelector('.comments-container');
    
    const comments = post.comments || [];
    commentsContainer.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-content">${escapeHtml(comment.content)}</div>
            <div class="comment-date">${new Date(comment.date).toLocaleString('zh-TW')}</div>
        </div>
    `).join('') || '<p class="text-muted">還沒有留言</p>';

    return commentSection.firstElementChild.outerHTML;
}

// 處理留言提交
function handleCommentSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const postCard = form.closest('.post-card');
    const postId = parseInt(postCard.dataset.postId);
    const input = form.querySelector('.comment-input');
    const content = input.value.trim();

    if (!content) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (!post.comments) {
        post.comments = [];
    }

    post.comments.push({
        content,
        date: new Date().toISOString()
    });

    localStorage.setItem('blog-posts', JSON.stringify(posts));
    input.value = '';
    showAllPosts();
}

// 讀取檔案為 Data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('檔案讀取失敗'));
        reader.readAsDataURL(file);
    });
}

// 讀取文字檔案內容
function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('文字檔案讀取失敗'));
        reader.readAsText(file);
    });
}

// 提交新文章
async function submitNewPost() {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const imageInput = document.getElementById('post-image');
    const textFileInput = document.getElementById('text-file');
    
    if (!title || !content) {
        alert('標題和內容都必須填寫');
        return;
    }
    
    let finalContent = content;
    
    // 處理文字檔案
    if (textFileInput.files.length > 0) {
        try {
            const textContent = await readTextFile(textFileInput.files[0]);
            finalContent = content + '\n\n--- 上傳的文字檔案內容 ---\n' + textContent;
        } catch (error) {
            console.error('文字檔案讀取失敗:', error);
            alert('文字檔案讀取失敗，請重試');
            return;
        }
    }
    
    let image = null;
    if (imageInput.files.length > 0) {
        const file = imageInput.files[0];
        try {
            image = await readFileAsDataURL(file);
        } catch (error) {
            console.error('圖片上傳失敗:', error);
            alert('圖片上傳失敗，請重試');
            return;
        }
    }
    
    const newPost = {
        id: Date.now(),
        title,
        content: finalContent,
        image,
        date: new Date().toISOString(),
        comments: []
    };
    
    try {
        posts.unshift(newPost);
        localStorage.setItem('blog-posts', JSON.stringify(posts));
        
        // 重設表單
        document.getElementById('post-form').reset();
        document.getElementById('image-preview').innerHTML = '';
        
        // 顯示成功訊息
        alert('文章發布成功！');
        
        // 重新導向到文章列表
        showAllPosts();
    } catch (error) {
        console.error('儲存文章失敗:', error);
        alert('發布文章時發生錯誤，請重試');
    }
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
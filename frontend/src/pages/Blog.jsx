import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import './Blog.css';

export default function Blog() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.getBlogPosts().then(setPosts);
  }, []);

  return (
    <div className="container blog-page">
      <h1>Blog</h1>
      <p className="blog-page__subtitle">Eğitim dünyasından haberler, ipuçları ve rehberler.</p>

      <div className="blog-page__grid">
        {posts.map((post) => (
          <Link to={`/blog/${post.slug}`} key={post.id} className="card blog-card">
            {post.cover_image_url && (
              <div className="blog-card__cover" style={{ backgroundImage: `url(${post.cover_image_url})` }} />
            )}
            <div className="blog-card__body">
              <h3>{post.title}</h3>
              {post.excerpt && <p>{post.excerpt}</p>}
              <span className="blog-card__date">
                {new Date(post.created_at).toLocaleDateString('tr-TR')}
              </span>
            </div>
          </Link>
        ))}
        {posts.length === 0 && <p className="blog-page__empty">Henüz blog yazısı yayınlanmadı.</p>}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import './BlogDetail.css';

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setPost(null);
    setNotFound(false);
    api.getBlogPost(slug).then(setPost).catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="container blog-detail">
        <p>Yazı bulunamadı.</p>
        <Link to="/blog">Blog'a dön</Link>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="container blog-detail">
      <Link to="/blog" className="blog-detail__back">
        ← Blog'a dön
      </Link>
      {post.cover_image_url && (
        <div className="blog-detail__cover" style={{ backgroundImage: `url(${post.cover_image_url})` }} />
      )}
      <h1>{post.title}</h1>
      <span className="blog-detail__date">
        {post.author_name && <>Yazan {post.author_name} · </>}
        {new Date(post.created_at).toLocaleDateString('tr-TR')}
      </span>
      <div className="blog-detail__content">
        {post.content.split('\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import { Navigation } from '@/components/Navigation';
import { PostEditor } from '@/components/PostEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Post } from '@/types';

const Submit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePostSave = (post: Post) => {
    navigate(`/p/${post.slug}`);
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation />
      <main className="py-8">
        <PostEditor
          type="article"
          onSave={handlePostSave}
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
};

export default Submit;
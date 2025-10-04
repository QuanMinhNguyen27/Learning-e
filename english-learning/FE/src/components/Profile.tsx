import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';

const ProfileContainer = styled.div`
  max-width: 500px;
  margin: 3rem auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #e6f4ea;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: #1abc9c;
  margin-bottom: 1.5rem;
`;

const Name = styled.h2`
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const Email = styled.p`
  color: #888;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  background: #e6f4ea;
  color: #1abc9c;
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #1abc9c;
    color: #fff;
  }
`;

const Profile = () => {
  const [user, setUser] = useState<{ email: string, name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setUser(data.data);
        } else {
          const text = await response.text();
          setError('User API did not return JSON: ' + text);
        }
      } catch (err) {
        setError('Error fetching user data.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return <ProfileContainer>Loading profile...</ProfileContainer>;
  if (error) return <ProfileContainer style={{ color: 'red' }}>{error}</ProfileContainer>;
  if (!user) return null;

  return (
    <ProfileContainer>
      <Avatar>{user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}</Avatar>
      <Name>{user.name || user.email.split('@')[0]}</Name>
      <Email>{user.email}</Email>
      <BackButton onClick={() => navigate('/dashboard')}>Back to Dashboard</BackButton>
    </ProfileContainer>
  );
};

export default Profile; 
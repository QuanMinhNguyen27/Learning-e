import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { Formik, Form as FormikForm, Field, ErrorMessage as FormikError } from 'formik';
import * as Yup from 'yup';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const FormContainer = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0052a3;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  text-align: center;
  margin-bottom: 1rem;
`;

const LinkText = styled.p`
  text-align: center;
  margin-top: 1rem;

  a {
    color: #0066cc;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Login = () => {
  const navigate = useNavigate();

  const initialValues = { email: '', password: '' };
  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().required('Password is required'),
  });

  const handleSubmit = async (values: { email: string; password: string }, { setSubmitting, setFieldError }: any) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        try {
          const userRes = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${data.token}` }
          });
          const userData = await userRes.json();
          if (userRes.ok && userData.data) {
            localStorage.setItem('user', JSON.stringify(userData.data));
            navigate('/dashboard');
          } else {
            setFieldError('email', userData.message || 'Failed to fetch user info. Please try again.');
            localStorage.removeItem('token');
          }
        } catch (err) {
          setFieldError('email', 'Error fetching user info. Please try again.');
          localStorage.removeItem('token');
        }
      } else {
        if (data.error === 'User not found' || data.error === 'Invalid credentials') {
          setFieldError('email', 'Incorrect email or password. Please try again.');
        } else {
          setFieldError('email', data.message || 'Login failed');
        }
      }
    } catch (err) {
      setFieldError('email', 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container>
      <FormContainer>
        <Title>Welcome Back</Title>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <StyledForm as={FormikForm}>
              <Field
                as={Input}
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="username"
              />
              <FormikError name="email" component={ErrorMessage} />
              <Field
                as={Input}
                type="password"
                name="password"
                placeholder="Password"
                autoComplete="current-password"
              />
              <FormikError name="password" component={ErrorMessage} />
              <Button type="submit" disabled={isSubmitting}>Sign In</Button>
            </StyledForm>
          )}
        </Formik>
        <LinkText>
          Don't have an account? <Link to="/register">Sign up</Link>
        </LinkText>
      </FormContainer>
    </Container>
  );
};

export default Login; 
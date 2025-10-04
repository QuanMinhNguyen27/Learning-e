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

const PasswordHint = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
`;

const Register = () => {
  const navigate = useNavigate();

  const initialValues = { email: '', password: '', confirmPassword: '' };
  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().min(7, 'Password must be at least 7 characters long').required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Confirm Password is required'),
  });

  const handleSubmit = async (values: { email: string; password: string; confirmPassword: string }, { setSubmitting, setFieldError }: any) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: values.email, password: values.password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        navigate('/dashboard');
      } else {
        setFieldError('email', data.error || 'Registration failed');
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
        <Title>Create Account</Title>
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
                autoComplete="new-password"
              />
              <FormikError name="password" component={ErrorMessage} />
              <PasswordHint>Password must be at least 7 characters long</PasswordHint>
              <Field
                as={Input}
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                autoComplete="new-password"
              />
              <FormikError name="confirmPassword" component={ErrorMessage} />
              <Button type="submit" disabled={isSubmitting}>Sign Up</Button>
            </StyledForm>
          )}
        </Formik>
        <LinkText>
          Already have an account? <Link to="/login">Sign in</Link>
        </LinkText>
      </FormContainer>
    </Container>
  );
};

export default Register; 
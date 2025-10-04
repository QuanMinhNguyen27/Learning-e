import { Link } from 'react-router-dom';
import styled from '@emotion/styled';

const Wrap = styled.main`
  min-height:100vh; display:grid; place-items:center; background:#f8f9fb; padding:2rem;
`;
const Card = styled.section`
  max-width:980px; background:#fff; border-radius:16px; box-shadow:0 8px 30px #0000000f;
  padding:clamp(1.25rem,3vw,3rem); text-align:center;
`;
const H1 = styled.h1`margin:0 0 .5rem; font-size:clamp(1.6rem,3vw,2.4rem);`;
const P  = styled.p`color:#52606d; margin:0 auto 1.25rem; max-width:60ch;`;
const Row = styled.div`display:flex; gap:.75rem; justify-content:center; flex-wrap:wrap;`;
const CTA = styled(Link)`
  padding:.75rem 1.1rem; border-radius:12px; text-decoration:none; font-weight:700;
  color:#fff; background:#16a085; border:1px solid #16a085; &:hover{filter:brightness(.95)}
`;
const Ghost = styled(CTA)`background:transparent; color:#16a085;`;

export default function Landing(){
  return (
    <Wrap>
      <Card>
        <H1>Learn English with Movies & Songs</H1>
        <P>Watch real content, save unknown words instantly, then master them with flashcards and quizzes.</P>
        <Row>
          <CTA to="/register">Get Started</CTA>
          <Ghost to="/login">I already have an account</Ghost>
        </Row>
      </Card>
    </Wrap>
  );
}

import { Link, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';

const Bar = styled.header`
  position: sticky; top: 0; z-index: 100;
  background:#fff; border-bottom:1px solid #eee;
  display:flex; align-items:center; justify-content:space-between;
  padding:.75rem 1rem;
`;
const Brand = styled(Link)`font-weight:800; text-decoration:none; color:#16a085; letter-spacing:.2px;`;
const Nav = styled.nav`display:flex; gap:.5rem; flex-wrap:wrap;`;
const Pill = styled(Link)<{active?:boolean}>`
  padding:.5rem .9rem; border-radius:999px; text-decoration:none;
  color:${p=>p.active?'#fff':'#16a085'};
  background:${p=>p.active?'#16a085':'transparent'};
  border:1px solid #16a085; font-weight:600;
`;

export default function Navbar(){
  const { pathname } = useLocation();
  return (
    <Bar>
      <Brand to="/dashboard">ELearn</Brand>
      <Nav>
        <Pill to="/dashboard"  active={pathname.startsWith('/dashboard')}>Dashboard</Pill>
        <Pill to="/watching"   active={pathname.startsWith('/watching')}>Watching</Pill>
        <Pill to="/vocab-bank" active={pathname.startsWith('/vocab-bank')}>Vocab</Pill>
        <Pill to="/flashcard"  active={pathname.startsWith('/flashcard')}>Flashcards</Pill>
        <Pill to="/quiz"       active={pathname.startsWith('/quiz')}>Quiz</Pill>
        <Pill to="/profile"    active={pathname.startsWith('/profile')}>Profile</Pill>
      </Nav>
    </Bar>
  );
}

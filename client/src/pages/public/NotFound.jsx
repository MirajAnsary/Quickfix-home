import { Link } from 'react-router-dom';
import Logo from '../../components/Logo';

export default function NotFound() {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center text-center p-4">
      <Logo />
      <h1 className="display-5 fw-bold mt-4 mb-1">404</h1>
      <p className="text-muted-qf">This page does not exist.</p>
      <Link to="/" className="btn btn-teal">Back to Home</Link>
    </div>
  );
}

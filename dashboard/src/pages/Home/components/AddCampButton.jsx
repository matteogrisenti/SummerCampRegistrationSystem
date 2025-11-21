import { useNavigate } from 'react-router-dom';

export default function AddCampButton({ loading = false }) {
  const navigate = useNavigate();
  
  return (
    <button 
      className="add-camp-button"
      onClick={() => navigate('/NewCamp')}
      disabled={loading}
      style={{ opacity: loading ? 0.7 : 1 }}
    >
      {!loading ? (
        <>
          <span className="icon">+</span>
          Add Camp
        </>
      ) : (
        "Creating..."
      )}
    </button>
  );
}

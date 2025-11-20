export default function AddCampButton({ onClick, loading = false }) {
  return (
    <button 
      className="add-camp-button"
      onClick={onClick}
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

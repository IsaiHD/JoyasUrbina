import './Input.css'; // Importación del CSS separado

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = (props: Props) => {
  return <input className="custom-input" {...props} />;
};
function Spinner({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div>
            <div className="" style={{
                width: '100px',
                height: '100px',
                border: '6px solid #ccc',
                borderTop: '6px solid #9333ea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
            }}>
            </div>
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
        </div>
    );
}
export {
    Spinner
};
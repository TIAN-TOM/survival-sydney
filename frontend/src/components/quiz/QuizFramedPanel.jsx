/**
 * Same chrome as the in-quiz question card: double border, top rule, L-brackets.
 * Use only inside `.quiz-flow-scope`.
 */
export default function QuizFramedPanel({ tag: Tag = 'div', className = '', children, ...rest }) {
  const extra = className.trim();
  return (
    <Tag
      className={`q-card framed sq-framed-panel${extra ? ` ${extra}` : ''}`.trim()}
      {...rest}
    >
      <svg className="bracket tl" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <polyline points="19,1 1,1 1,19" fill="none" stroke="var(--sq-btn-a)" strokeWidth="2" strokeLinecap="square" />
      </svg>
      <svg className="bracket tr" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <polyline points="1,1 19,1 19,19" fill="none" stroke="var(--sq-btn-a)" strokeWidth="2" strokeLinecap="square" />
      </svg>
      <svg className="bracket bl" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <polyline points="19,19 1,19 1,1" fill="none" stroke="var(--sq-btn-a)" strokeWidth="2" strokeLinecap="square" />
      </svg>
      <svg className="bracket br" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <polyline points="1,19 19,19 19,1" fill="none" stroke="var(--sq-btn-a)" strokeWidth="2" strokeLinecap="square" />
      </svg>
      {children}
    </Tag>
  );
}

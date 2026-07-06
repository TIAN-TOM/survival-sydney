/** L-bracket corners for Review Mode / History framed panels (matches `quiz-review-page` CSS). */
export default function FrameCorners() {
  return (
    <>
      <svg className="frame-corner frame-corner--tl" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <polyline points="19,1 1,1 1,19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </svg>
      <svg className="frame-corner frame-corner--tr" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <polyline points="1,1 19,1 19,19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </svg>
      <svg className="frame-corner frame-corner--bl" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <polyline points="19,19 1,19 1,1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </svg>
      <svg className="frame-corner frame-corner--br" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <polyline points="1,19 19,19 19,1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </svg>
    </>
  );
}

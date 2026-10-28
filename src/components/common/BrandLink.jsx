import watermarkSvg from '../../assets/brand/watermark.svg';
import { Link } from '../../lib/router';

export default function BrandLink({
  to = '/',
  className,
  markClassName,
  markWidth,
  markHeight,
  nameClassName,
  nameId,
  children = 'Blau Tech',
}) {
  return (
    <Link to={to} className={className} aria-label="Blau Tech home">
      <img src={watermarkSvg} alt="" className={markClassName} width={markWidth} height={markHeight} />
      <span id={nameId} className={nameClassName}>{children}</span>
    </Link>
  );
}

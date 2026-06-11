import type { ProductFeaturePageData } from '~/data/product-feature-pages';

export const ProductGuiIntroSection = ({
  image,
  title,
  description,
}: {
  image: ProductFeaturePageData['heroImage'];
  title: string;
  description: string;
}) => (
  <section data-wf-el='section' className='product-feature-section product-gui-intro-section' style={{ display: 'block', backgroundColor: 'rgb(24, 24, 24)', color: 'rgb(247, 243, 238)', position: 'relative', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px' }}>
    <div data-wf-el='container' className='product-feature-container mx-auto max-w-[1238px]' style={{ display: 'block', width: 'calc(100% - 80px)', maxWidth: '1238px', marginLeft: 'auto', marginRight: 'auto' }}>
      <div className='product-gui-intro-row' style={{ display: 'flex', marginLeft: '-20px', marginRight: '-20px' }}>
        <div className='product-gui-intro-media-col' style={{ width: '50%', paddingLeft: '20px', paddingRight: '20px', minHeight: 'min(469px, 52.5vw)' }}>
          <div data-wf-el='product-list_img_wrap' className='product-gui-hero-image-wrap bg-brand-bg' style={{ backgroundColor: 'rgb(247, 243, 238)', border: '1px solid rgb(179, 168, 140)', borderRadius: '16px', boxSizing: 'border-box', color: 'rgb(247, 243, 238)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', width: '100%', minHeight: '100%', marginLeft: '0px', padding: '96px 64px 64px', boxShadow: 'none' }}>
            <div data-wf-el='product-list_img_overlay' className='absolute inset-x-0 top-0 text-brand-fg' style={{ backgroundColor: 'rgb(179, 168, 140)', color: 'rgb(24, 24, 24)', zIndex: 1, padding: '16px' }}>
              <div data-wf-el='eyebrow' className='font-mono' style={{ fontSize: '14.08px', lineHeight: '16.896px', marginBottom: '0px', width: '100%' }}>Web&nbsp;GUI</div>
            </div>
            <img data-wf-el='product-list_img' src={image.src} alt={image.alt} style={{ width: '100%', maxWidth: '469px', height: 'auto', borderRadius: '0px', color: 'rgb(247, 243, 238)', display: 'block', objectFit: 'scale-down' }} />
          </div>
        </div>
        <div className='product-gui-intro-copy-col' style={{ width: '50%', paddingLeft: '20px', paddingRight: '20px', minHeight: 'min(469px, 52.5vw)' }}>
          <div data-wf-el='heading-stack' className='text-brand-bg' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', paddingLeft: '0px', paddingRight: '0px', width: '100%', height: '100%' }}>
            <h2 className='section-title'>{title}</h2>
            <p data-wf-el='paragraph-lg' className='fluid-body-lg text-[#b3a88c]' style={{ marginTop: '0px', marginBottom: '20.8px', width: '100%', textWrap: 'pretty', wordSpacing: '0.025px' }}>{description}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

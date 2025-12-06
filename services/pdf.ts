
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { StorySegment, PresentationConfig } from '../types';

export const generateStoryPDF = async (
  topic: string,
  segments: StorySegment[],
  presentationConfig: PresentationConfig
) => {
  // Create a container to render pages off-screen
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px'; // A4 width at 96dpi approx (210mm)
  document.body.appendChild(container);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;

  try {
    // 1. Title Page
    const titlePage = document.createElement('div');
    titlePage.style.width = '794px';
    titlePage.style.height = '1123px';
    titlePage.style.backgroundColor = '#fffbeb'; // brand-50
    titlePage.style.display = 'flex';
    titlePage.style.flexDirection = 'column';
    titlePage.style.alignItems = 'center';
    titlePage.style.justifyContent = 'center';
    titlePage.style.padding = '40px';
    titlePage.style.fontFamily = presentationConfig.fontFamily.split(',')[0].replace(/['"]/g, '');
    
    titlePage.innerHTML = `
      <div style="border: 8px double #f59e0b; padding: 40px; border-radius: 20px; text-align: center; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 80%;">
        <h1 style="font-size: 48px; color: #78350f; margin-bottom: 20px; line-height: 1.2;">${topic}</h1>
        <div style="width: 100px; height: 4px; background: #f59e0b; margin: 0 auto 30px;"></div>
        <p style="font-size: 24px; color: #b45309;">An Educational Story</p>
        <div style="margin-top: 50px; font-size: 16px; color: #9ca3af;">Created with Teacher's Imagination Studio</div>
      </div>
    `;
    container.appendChild(titlePage);
    
    // Allow styles to apply
    await new Promise(r => setTimeout(r, 100));

    const titleCanvas = await html2canvas(titlePage, { scale: 2, useCORS: true });
    doc.addImage(titleCanvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, pageWidth, pageHeight);
    container.removeChild(titlePage);

    // 2. Story Pages
    for (let i = 0; i < segments.length; i++) {
        doc.addPage();
        const segment = segments[i];
        const page = document.createElement('div');
        page.style.width = '794px';
        page.style.height = '1123px';
        page.style.backgroundColor = '#ffffff';
        page.style.display = 'flex';
        page.style.flexDirection = 'column';
        page.style.padding = '50px';
        page.style.boxSizing = 'border-box';
        page.style.fontFamily = presentationConfig.fontFamily.split(',')[0].replace(/['"]/g, '');

        // Image
        let imageHtml = '';
        const imgUrl = (segment.imageUrls && segment.imageUrls.length > 0) 
            ? segment.imageUrls[segment.previewIndex || 0] 
            : segment.imageUrl;
            
        if (imgUrl) {
            // Check if it is video URL (ignore)
            if (!segment.videoUrl) {
                imageHtml = `
                    <div style="width: 100%; height: 500px; display: flex; align-items: center; justify-content: center; margin-bottom: 40px; border: 4px solid #fef3c7; border-radius: 20px; overflow: hidden; background-color: #f9fafb;">
                        <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: contain;" crossorigin="anonymous" />
                    </div>
                `;
            } else {
                 // For video, we try to use the placeholder image if available
                 imageHtml = `
                    <div style="width: 100%; height: 500px; display: flex; align-items: center; justify-content: center; margin-bottom: 40px; border: 4px dashed #fef3c7; border-radius: 20px; background-color: #f9fafb; color: #9ca3af; flex-direction: column; gap: 10px;">
                         ${imgUrl ? `<img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: contain; opacity: 0.7;" crossorigin="anonymous" />` : '<span>Video Content (Not available in PDF)</span>'}
                    </div>
                `;
            }
        } else {
             imageHtml = `
                <div style="width: 100%; height: 500px; display: flex; align-items: center; justify-content: center; margin-bottom: 40px; border: 4px dashed #e5e7eb; border-radius: 20px; background-color: #f9fafb; color: #9ca3af;">
                    No Image
                </div>
            `;
        }

        const fontSize = presentationConfig.fontSize === 'small' ? '24px' : presentationConfig.fontSize === 'large' ? '32px' : presentationConfig.fontSize === 'xl' ? '36px' : '28px';
        
        page.innerHTML = `
            <div style="flex: 1; display: flex; flex-direction: column;">
                <div style="font-size: 14px; font-weight: bold; color: #f59e0b; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Scene ${i + 1}</div>
                ${imageHtml}
                <div style="flex: 1; font-size: ${fontSize}; line-height: 1.6; color: #1f2937; text-align: left; padding: 30px; background: #fffbeb; border-radius: 15px; border-left: 8px solid #fcd34d; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    ${segment.text}
                </div>
                <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #d1d5db;">Page ${i + 2}</div>
            </div>
        `;
        
        container.appendChild(page);
        
        await new Promise(r => setTimeout(r, 200)); // Ensure render

        const canvas = await html2canvas(page, { scale: 2, useCORS: true });
        doc.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 0, 0, pageWidth, pageHeight);
        container.removeChild(page);
    }

    doc.save(`story-book-${topic.replace(/\s+/g, '-').toLowerCase()}.pdf`);

  } catch (error) {
    console.error("PDF generation failed", error);
    throw error;
  } finally {
    document.body.removeChild(container);
  }
};

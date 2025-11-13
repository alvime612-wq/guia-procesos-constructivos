import React, { useState, useEffect, useRef } from 'react';
import { type SearchResult } from '../types';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { LinkIcon } from './icons/LinkIcon';
import { ImageIcon } from './icons/ImageIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import jsPDF from 'jspdf';
import { ImageErrorIcon } from './icons/ImageErrorIcon';
import { Packer, Document, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Numbering, ExternalHyperlink } from 'docx';
import saveAs from 'file-saver';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { PdfIcon } from './icons/PdfIcon';
import { WordIcon } from './icons/WordIcon';


interface ResultCardProps {
  result: SearchResult;
}

export const ResultCard: React.FC<ResultCardProps> = ({ 
  result,
}) => {
  const [imageHasError, setImageHasError] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);

  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImageHasError(false);
  }, [result.image_base64]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleImageError = () => {
    setImageHasError(true);
  };

  const handleDownloadPDF = async () => {
    setIsDownloadingPdf(true);
    setIsDownloadMenuOpen(false);
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter' // Standard Letter size (8.5x11 inches)
      });

      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 25.4; // 1 inch margin
      const contentWidth = pageWidth - margin * 2;
      let y = margin;
      
      const H2_FONT_SIZE = 14;
      const BODY_FONT_SIZE = 11;
      const H2_LINE_HEIGHT = 7;
      const BODY_LINE_HEIGHT = 5;
      const SPACE_BEFORE_H2 = 8;
      const SPACE_AFTER_H2 = 5;
      const LIST_ITEM_SPACING = 3;

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };
      
      const addHeading = (text: string, contentLines: string[] | number) => {
          const firstContentLineHeight = Array.isArray(contentLines) ? (contentLines.length > 0 ? BODY_LINE_HEIGHT : 0) : contentLines;
          // Prevent orphan headings by checking if the heading and at least one line of content fit
          if (y + H2_LINE_HEIGHT + firstContentLineHeight > pageHeight - margin) {
              doc.addPage();
              y = margin;
          } else {
              y += SPACE_BEFORE_H2;
          }

          doc.setFontSize(H2_FONT_SIZE);
          doc.setFont(undefined, 'bold');
          doc.text(text, margin, y);
          y += H2_LINE_HEIGHT + SPACE_AFTER_H2;
          doc.setFontSize(BODY_FONT_SIZE);
          doc.setFont(undefined, 'normal');
      };

      // Title
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      const titleLines = doc.splitTextToSize(result.title.toUpperCase(), contentWidth);
      checkPageBreak(titleLines.length * 8);
      doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
      y += titleLines.length * 8 + 10;

      // Description
      const descriptionLines = doc.splitTextToSize(result.description, contentWidth);
      addHeading("Descripción", descriptionLines);
      checkPageBreak(descriptionLines.length * BODY_LINE_HEIGHT);
      doc.text(descriptionLines, margin, y);
      y += descriptionLines.length * BODY_LINE_HEIGHT;

      // Procedure
      const procedureLines = doc.splitTextToSize(result.steps[0] || '', contentWidth);
      addHeading("Procedimiento", procedureLines);
      result.steps.forEach(step => {
        const fullStepText = `• ${step}`;
        const textLines = doc.splitTextToSize(fullStepText, contentWidth - 5);
        checkPageBreak(textLines.length * BODY_LINE_HEIGHT + LIST_ITEM_SPACING);

        const colonIndex = step.indexOf(':');
        if (colonIndex > -1) {
            const stepTitle = step.substring(0, colonIndex + 1);
            const stepDesc = step.substring(colonIndex + 1);
            
            doc.text('•', margin, y, {});
            doc.setFont(undefined, 'bold');
            doc.text(stepTitle, margin + 3, y, {});
            
            const titleWidth = doc.getTextWidth(stepTitle);
            
            doc.setFont(undefined, 'normal');
            doc.text(stepDesc, margin + 3 + titleWidth, y, { maxWidth: contentWidth - 3 - titleWidth });
        } else {
            doc.setFont(undefined, 'normal');
            doc.text(fullStepText, margin, y, { maxWidth: contentWidth });
        }
        y += textLines.length * BODY_LINE_HEIGHT + LIST_ITEM_SPACING;
      });

      // Norms
      const normLines = doc.splitTextToSize(`${result.norms[0]?.name}: ${result.norms[0]?.description}` || '', contentWidth);
      addHeading("Normas Aplicables", normLines);
      result.norms.forEach(norm => {
        const normTitle = `• ${norm.name}:`;
        const normDesc = norm.description;
        const textLines = doc.splitTextToSize(`${normTitle} ${normDesc}`, contentWidth - 5);
        checkPageBreak(textLines.length * BODY_LINE_HEIGHT + LIST_ITEM_SPACING);

        doc.setFont(undefined, 'bold');
        doc.text(normTitle, margin + 5, y, {});

        const titleWidth = doc.getTextWidth(normTitle);
        doc.setFont(undefined, 'normal');
        doc.text(normDesc, margin + 5 + titleWidth + 1, y, { maxWidth: contentWidth - 5 - titleWidth - 1 });

        y += textLines.length * BODY_LINE_HEIGHT + LIST_ITEM_SPACING;
      });
      
      // Image
      if (result.image_base64 && !imageHasError) {
        const imgProps = doc.getImageProperties(result.image_base64);
        const ratio = imgProps.width / imgProps.height;
        let imgHeight = 100;
        let imgWidth = imgHeight * ratio;

        if (imgWidth > contentWidth) {
          imgWidth = contentWidth;
          imgHeight = imgWidth / ratio;
        }
        
        addHeading("Ilustración de Referencia", imgHeight);
        
        checkPageBreak(imgHeight);
        const x = (pageWidth - imgWidth) / 2;
        doc.addImage(result.image_base64, 'PNG', x, y, imgWidth, imgHeight);
        y += imgHeight;
      }

      // Sources
      if (result.sources && result.sources.length > 0) {
        addHeading("Fuentes", [result.sources[0].uri]);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 255);
        result.sources.forEach(source => {
          const sourceLines = doc.splitTextToSize(source.uri, contentWidth);
          checkPageBreak(sourceLines.length * 4 + 2);
          doc.textWithLink(source.title || source.uri, margin, y, { url: source.uri });
          y += sourceLines.length * 4 + 2;
        });
        doc.setTextColor(0, 0, 0);
      }
      
      doc.save(`guia-${result.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const getImageDimensions = (base64: string): Promise<{ width: number, height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = (err) => reject(err);
      img.src = base64;
    });
  };

  const handleDownloadDOCX = async () => {
    setIsDownloadingDocx(true);
    setIsDownloadMenuOpen(false);
    try {
      const children = [];
      children.push(new Paragraph({
        text: result.title.toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }));

      // Description
      children.push(new Paragraph({
        text: "Descripción",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 }
      }));
      children.push(new Paragraph({ text: result.description, spacing: { after: 200 }}));
      
      // Procedure
      children.push(new Paragraph({
        text: "Procedimiento",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 }
      }));
      result.steps.forEach(step => {
        const colonIndex = step.indexOf(':');
        const runs = [new TextRun({ text: "•\t", font: "Symbol" })];
        if (colonIndex > -1) {
          runs.push(new TextRun({ text: step.substring(0, colonIndex + 1), bold: true }));
          runs.push(new TextRun({ text: step.substring(colonIndex + 1) }));
        } else {
          runs.push(new TextRun(step));
        }
        children.push(new Paragraph({ children: runs, spacing: { after: 80 } }));
      });
      children.push(new Paragraph({ spacing: { after: 200 }, text: "" }));

      // Norms
      children.push(new Paragraph({
        text: "Normas Aplicables",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 }
      }));
      result.norms.forEach(norm => {
        children.push(new Paragraph({ 
            bullet: { level: 0 }, 
            spacing: { after: 80 },
            children: [
                new TextRun({ text: `${norm.name}: `, bold: true }),
                new TextRun(norm.description)
            ]
        }));
      });
      children.push(new Paragraph({ spacing: { after: 200 }, text: "" }));
      
      // Image
      if (result.image_base64 && !imageHasError) {
        children.push(new Paragraph({
          text: "Ilustración de Referencia",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          pageBreakBefore: true,
        }));
        try {
          const dims = await getImageDimensions(result.image_base64);
          const ratio = dims.width / dims.height;
          const maxWidth = 500;
          const finalWidth = Math.min(dims.width, maxWidth);
          const finalHeight = finalWidth / ratio;
          
          children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              // FIX: The 'docx' library's ImageRun options property for image data was changed from 'data' to 'buffer' in a recent version.
              new ImageRun({
                buffer: result.image_base64.split(',')[1],
                transformation: { width: finalWidth, height: finalHeight },
              }),
            ],
            spacing: { after: 200 }
          }));
        } catch(e) {
            console.error("Could not process image for DOCX", e)
        }
      }

      // Sources
      if (result.sources && result.sources.length > 0) {
        children.push(new Paragraph({
          text: "Fuentes",
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 100 },
          pageBreakBefore: true,
        }));
        result.sources.forEach(source => {
            children.push(new Paragraph({
                children: [
                    new ExternalHyperlink({
                        children: [ new TextRun({ text: source.title || source.uri, style: "Hyperlink" }) ],
                        link: source.uri
                    }),
                ],
                spacing: { after: 80 }
            }));
        });
      }

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch margins
            },
          },
          children,
        }]
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `guia-${result.title.replace(/\s+/g, '-').toLowerCase()}.docx`);
    } catch(error) {
      console.error('Error generating DOCX:', error);
    } finally {
      setIsDownloadingDocx(false);
    }
  }

  const renderImage = () => {
    if (result.image_base64 && !imageHasError) {
      return (
        <img 
          src={result.image_base64}
          className="w-full max-w-lg h-auto object-contain rounded-lg shadow-md" 
          alt={`Ilustración para ${result.title}`}
          onError={handleImageError} 
        />
      );
    }

    if (imageHasError) {
      return (
        <div className="w-full max-w-lg h-56 bg-red-50 rounded-lg flex flex-col items-center justify-center text-red-700 border border-red-200">
            <ImageErrorIcon />
            <span className="mt-2 text-sm">Error al cargar la ilustración</span>
        </div>
      );
    }

    return (
      <div className="w-full max-w-lg h-56 bg-blue-50 rounded-lg flex flex-col items-center justify-center text-blue-500">
          <ImageIcon />
          <span className="mt-2 text-sm">Ilustración de referencia no disponible</span>
      </div>
    );
  };
  
  const isDownloading = isDownloadingPdf || isDownloadingDocx;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fade-in divide-y divide-slate-200 relative">
      <div ref={downloadMenuRef} className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          onClick={() => setIsDownloadMenuOpen(prev => !prev)}
          disabled={isDownloading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-wait"
        >
          <DownloadIcon />
          <span className="hidden sm:inline">
            {isDownloading ? 'Generando...' : 'Descargar'}
          </span>
          <ChevronDownIcon />
        </button>
        {isDownloadMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-slate-200">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3 disabled:opacity-50"
            >
              <PdfIcon />
              <span>{isDownloadingPdf ? 'Generando PDF...' : 'Como PDF'}</span>
            </button>
            <button
              onClick={handleDownloadDOCX}
              disabled={isDownloadingDocx}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3 disabled:opacity-50"
            >
              <WordIcon />
              <span>{isDownloadingDocx ? 'Generando Word...' : 'Como Word (.docx)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main content section */}
      <div className="pb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 capitalize pr-10 sm:pr-40">{result.title}</h2>
        <p className="mt-4 text-base text-slate-600 leading-relaxed">{result.description}</p>

        <h3 className="mt-6 font-semibold text-lg text-slate-700 flex items-center gap-2">
          <CheckCircleIcon />
          Procedimiento
        </h3>
        <ol className="list-decimal list-inside mt-3 text-slate-600 space-y-2 pl-2">
          {result.steps.map((step, index) => {
            const colonIndex = step.indexOf(':');
            if (colonIndex > -1) {
                const title = step.substring(0, colonIndex + 1);
                const description = step.substring(colonIndex + 1);
                return (
                    <li key={index}>
                        <strong className="font-semibold text-slate-700">{title}</strong>
                        <span>{description}</span>
                    </li>
                );
            }
            return <li key={index}>{step}</li>;
          })}
        </ol>

        <h3 className="mt-6 font-semibold text-lg text-slate-700 flex items-center gap-2">
          <DocumentTextIcon />
          Normas Aplicables
        </h3>
        <ul className="list-disc list-inside mt-3 text-slate-600 space-y-2 pl-2">
          {result.norms.map((norm, index) => (
            <li key={index}>
              <strong className="font-semibold text-slate-700">{norm.name}:</strong> {norm.description}
            </li>
          ))}
        </ul>
      </div>

      {/* Image section */}
      <div className="py-6">
        <h3 className="font-semibold text-lg text-slate-700">Ilustración de Referencia</h3>
        <div className="mt-4 flex flex-col items-center justify-center">
            {renderImage()}
        </div>
      </div>
      
       {result.sources && result.sources.length > 0 && (
          <div className="pt-6">
            <h4 className="font-semibold text-sm text-slate-500 flex items-center gap-2"><LinkIcon />Fuentes</h4>
            <div className="mt-2 text-xs text-slate-600 space-y-1">
              {result.sources.map((source, index) => (
                <div key={index} className="truncate">
                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-600 break-all">
                        {source.title || source.uri}
                    </a>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};
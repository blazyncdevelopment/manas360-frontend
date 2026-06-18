import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEnrollmentStore } from '../store/CertificationEnrollmentStore';
import { Enrollment } from '../CertificationTypes';
import { QRCodeSVG } from 'qrcode.react';
import { Download, ArrowLeft, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCertificationProgress } from '../store/useCertificationProgress';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

function generateCertId(enrollmentId: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let seed = 0;
    for (let i = 0; i < enrollmentId.length; i++) {
        seed = (seed * 31 + enrollmentId.charCodeAt(i)) >>> 0;
    }
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars[seed % chars.length];
        seed = (seed * 1664525 + 1013904223) >>> 0;
    }
    return result;
}

function calcFontCqi(name: string): number {
    return Math.min(60 / (name.length * 0.55), 2.2);
}

const CertificationCertificatePage: React.FC = () => {
    const { enrollmentId } = useParams<{ enrollmentId: string }>();
    const navigate = useNavigate();
    const { enrollments, updateEnrollment } = useEnrollmentStore();
    const { isQuizPassed } = useCertificationProgress();
    const certificateRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    const enrollment = enrollments.find((e: Enrollment) => e.id === enrollmentId);

    const certId = enrollment?.certId ?? (enrollmentId ? generateCertId(enrollmentId) : 'MX0001');

    /**
     * THE KEY FIX: Write certId onto the enrollment record on first view.
     * The verification page matches ONLY on e.certId (no hash fallback),
     * so this stored value is the single source of truth.
     */
    useEffect(() => {
        if (enrollment && !enrollment.certId && updateEnrollment) {
            updateEnrollment(enrollment.id, { certId });
        }
    }, [enrollment, certId, updateEnrollment]);

    // Force load fonts so html-to-image can embed them properly
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@400;600&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => {
            if (document.head.contains(link)) document.head.removeChild(link);
        };
    }, []);

    const qrValue = `${window.location.origin}/verify/${certId}`;
    const fontCqi = enrollment ? calcFontCqi(enrollment.certificationName) : 1.75;
    const displayCertId = certId.includes('_') ? certId.split('_').pop() : certId;

    const handleDownloadPDF = async () => {
        if (!certificateRef.current) return;
        try {
            await document.fonts.ready;

            // html-to-image natively uses browser's rendering engine (SVG foreignObject),
            // which flawlessly supports cqi container queries and custom fonts!
            const imgData = await htmlToImage.toJpeg(certificateRef.current, {
                quality: 0.95,
                pixelRatio: 2, // High resolution
            });

            // The width and height as rendered on screen
            const width = certificateRef.current.offsetWidth;
            const height = certificateRef.current.offsetHeight;

            const pdf = new jsPDF({
                orientation: 'landscape', unit: 'px',
                format: [width, height],
            });
            pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
            pdf.save(`Certificate-${enrollment?.certificationName || 'Manas360'}-${certId}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
        }
    };

    const handlePrint = async () => {
        if (!certificateRef.current) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Please allow popups to print the certificate.");
            return;
        }

        printWindow.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><h2>Preparing document for printing...</h2></body></html>');

        try {
            await document.fonts.ready;
            const imgData = await htmlToImage.toJpeg(certificateRef.current, {
                quality: 0.95,
                pixelRatio: 2,
            });

            printWindow.document.open();
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Certificate</title>
                        <style>
                            body { margin: 0; padding: 0; background: white; }
                            @page { size: landscape; margin: 0; }
                            img { width: 100vw; height: 100vh; object-fit: contain; }
                        </style>
                    </head>
                    <body>
                        <img src="${imgData}" onload="window.print(); window.close();" />
                    </body>
                </html>
            `);
            printWindow.document.close();
        } catch (err) {
            console.error('Print failed:', err);
            printWindow.close();
        }
    };

    if (!enrollment || (enrollmentId && !isQuizPassed(enrollmentId))) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-slate-800 mb-4">
                        {!enrollment ? "Certification Details Not Loaded" : "Certificate Locked"}
                    </h2>
                    {enrollment && (!enrollmentId || !isQuizPassed(enrollmentId)) && (
                        <p className="text-slate-600 mb-6 max-w-md mx-auto">
                            You must attend all course modules and pass the final certification quiz to unlock this certificate.
                        </p>
                    )}
                    <button onClick={() => navigate(-1)} className="text-teal-600 font-bold hover:underline">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#111827] py-10 px-4 flex flex-col items-center overflow-x-hidden relative" id="cert-container">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@400;600&display=swap');
      `}</style>

            <div className="no-print max-w-[980px] w-full flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-300 hover:text-white font-semibold transition text-sm"
                >
                    <ArrowLeft size={18} /> Back to Learning
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 border border-white/20 transition text-sm"
                    >
                        <Printer size={16} /> Print
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-white text-sm transition hover:brightness-110 shadow-lg"
                        style={{ background: 'linear-gradient(135deg,#c5a059,#8a6d3b)' }}
                    >
                        <Download size={16} /> Download PDF
                    </button>
                </div>
            </div>

            <div
                id="cert-wrapper"
                ref={certificateRef}
                className="relative w-full max-w-[980px] shadow-[0_30px_80px_rgba(0,0,0,0.8)] overflow-hidden bg-white"
                style={{ aspectRatio: '2340 / 1655', containerType: 'inline-size' }}
            >
                <img
                    src="/Certificate.png"
                    alt="Certificate background"
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: 'fill' }}
                    crossOrigin="anonymous"
                />

                <div
                    className="absolute bg-white"
                    style={{
                        top: '3%', right: '1.5%',
                        width: '8%', aspectRatio: '1 / 1',
                        padding: '0.4%', boxSizing: 'border-box',
                    }}
                >
                    <QRCodeSVG
                        value={qrValue} size={256}
                        fgColor="#0a1630" bgColor="#ffffff"
                        includeMargin={false}
                        style={{ width: '100%', height: '100%', display: 'block' }}
                    />
                </div>

                {/* EXACT ABSOLUTE POSITIONING TO MATCH THE REFERENCE IMAGE */}
                <div
                    className="absolute flex justify-center"
                    style={{ top: '13.5%', left: '4%', width: '58%' }}
                >
                    <span style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#c5a059',
                        fontSize: '4.8cqi',
                        lineHeight: 1,
                        letterSpacing: '0.05em',
                        textAlign: 'center',
                    }}>
                        CERTIFICATE
                    </span>
                </div>

                <div
                    className="absolute flex justify-center"
                    style={{ top: '23.5%', left: '4%', width: '58%' }}
                >
                    <span style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#c5a059',
                        fontSize: '2.2cqi',
                        lineHeight: 1,
                        letterSpacing: '0.25em',
                        textAlign: 'center',
                    }}>
                        OF COMPLETION
                    </span>
                </div>

                <div
                    className="absolute flex justify-center"
                    style={{ top: '34%', left: '4%', width: '58%' }}
                >
                    <span style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#c5a059',
                        fontSize: '1.5cqi',
                        textAlign: 'center',
                        letterSpacing: '0.02em',
                    }}>
                        This is to certify that
                    </span>
                </div>

                <div
                    className="absolute flex justify-center"
                    style={{ top: '41%', left: '4%', width: '58%' }}
                >
                    <span style={{
                        fontFamily: "'Great Vibes', cursive",
                        color: '#c5a059',
                        fontSize: `${Math.min(9, 85 / (((user as any)?.name || (user as any)?.displayName || enrollment.userName || 'Recipient Name').length * 0.5))}cqi`,
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        display: 'block',
                        textShadow: '0 1px 5px rgba(197,160,89,0.3)',
                    }}>
                        {(user as any)?.name || (user as any)?.displayName || enrollment.userName || 'Recipient Name'}
                    </span>
                </div>

                <div
                    className="absolute flex justify-center"
                    style={{ top: '58%', left: '4%', width: '58%' }}
                >
                    <span style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#c5a059',
                        fontSize: '1.3cqi',
                        textAlign: 'center',
                        lineHeight: 1.5,
                    }}>
                        has successfully completed the course and awarded &nbsp;&nbsp;&nbsp;by Manas360 Mental<br />
                        Wellness Pvt Ltd., as
                    </span>
                </div>

                <div
                    className="absolute flex justify-center"
                    style={{ top: '69.5%', left: '4%', width: '58%' }}
                >
                    <span style={{
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 600,
                        color: '#c5a059',
                        fontSize: `${fontCqi}cqi`,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                        display: 'block',
                        lineHeight: 1,
                        textAlign: 'center',
                    }}>
                        {enrollment.certificationName}
                    </span>
                </div>

                {/* BOTTOM LEFT: Certification ID */}
                <div
                    className="absolute flex items-start"
                    style={{ top: '85%', left: '10%', width: '42%' }}
                >
                    <span style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#c5a059',
                        fontSize: '1.4cqi',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2,
                        textTransform: 'uppercase',
                    }}>
                        CERTIFICATION ID :
                    </span>
                    <span style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#c5a059',
                        fontWeight: 600,
                        fontSize: '1.1cqi',
                        letterSpacing: '0.05em',
                        lineHeight: 1.5,
                        marginLeft: '1cqi',
                        whiteSpace: 'nowrap',
                        textTransform: 'uppercase',
                    }}>
                        {displayCertId}
                    </span>
                </div>

                {/* BOTTOM RIGHT: Signature */}
                <div
                    className="absolute flex justify-center"
                    style={{ top: '75%', left: '46%', width: '25%' }}
                >
                    <span style={{
                        fontFamily: "'Great Vibes', cursive",
                        color: '#c5a059',
                        fontSize: '4.5cqi',
                        transform: 'rotate(-5deg)',
                        display: 'block',
                    }}>
                        Howard Ong
                    </span>
                </div>

                <div
                    className="absolute flex justify-center"
                    style={{ top: '85%', left: '46%', width: '25%' }}
                >
                    <span style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#c5a059',
                        fontSize: '1.4cqi',
                        textAlign: 'center',
                        lineHeight: 1,
                    }}>
                        Howard Ong
                    </span>
                </div>

                <div
                    className="absolute flex justify-center"
                    style={{ top: '90%', left: '46%', width: '25%' }}
                >
                    <span style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#c5a059',
                        fontSize: '1cqi',
                        textAlign: 'center',
                        lineHeight: 1,
                    }}>
                        Chair-Clinical Advisory Board
                    </span>
                </div>
            </div>

            <p className="no-print mt-4 text-slate-500 text-xs text-center">
                Certificate ID:{' '}
                <span className="text-amber-400 font-mono font-bold tracking-widest">{displayCertId}</span>
                {' · '}Verify at{' '}
                <a href={qrValue} className="text-amber-400 underline underline-offset-2" target="_blank" rel="noreferrer">
                    {window.location.hostname}/verify/{certId}
                </a>
            </p>
        </div>
    );
};

export default CertificationCertificatePage;
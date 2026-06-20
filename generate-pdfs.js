import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate CSR Proposal Template PDF
const doc1 = new PDFDocument();
doc1.pipe(fs.createWriteStream(path.join(__dirname, 'public', 'CSR_Proposal_Template.pdf')));
doc1.fontSize(20).text('MANAS360 CSR Proposal Template', { underline: true });
doc1.moveDown();
doc1.fontSize(14).text('1. Executive Summary');
doc1.fontSize(12).text('- Fulfill Section 135 requirements.');
doc1.text('- Improve mental health metrics.');
doc1.moveDown();
doc1.fontSize(14).text('2. Budget Allocation');
doc1.fontSize(12).text('- 30% tax deduction eligible.');
doc1.text('- Transparent reporting.');
doc1.moveDown();
doc1.fontSize(14).text('3. Impact Metrics');
doc1.fontSize(12).text('- Monthly usage analytics.');
doc1.text('- Improvement in PHQ-9 scores.');
doc1.end();

// Generate Parent Guide PDF
const doc2 = new PDFDocument();
doc2.pipe(fs.createWriteStream(path.join(__dirname, 'public', 'Parent_Guide_Exam_Stress.pdf')));
doc2.fontSize(20).text('Parent Guide: Managing Exam Stress', { underline: true });
doc2.moveDown();
doc2.fontSize(14).text('1. Identifying Signs of Stress');
doc2.fontSize(12).text('- Changes in sleep or appetite.');
doc2.text('- Irritability or withdrawal.');
doc2.moveDown();
doc2.fontSize(14).text('2. Creating a Supportive Environment');
doc2.fontSize(12).text('- Encourage regular breaks.');
doc2.text('- Maintain a balanced diet.');
doc2.moveDown();
doc2.fontSize(14).text('3. How to Talk About Exams');
doc2.fontSize(12).text('- Focus on effort, not just grades.');
doc2.text('- Be an active listener.');
doc2.end();

console.log('PDFs generated successfully!');

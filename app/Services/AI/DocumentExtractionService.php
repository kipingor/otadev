<?php

namespace App\Services\AI;

use Exception;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\IOFactory;

class DocumentExtractionService
{
    /**
     * Extract text from an uploaded document path.
     * Supports PDF (via `pdftotext` if available) and DOCX via PHPWord.
     *
     * @param string $storagePath Storage path (disk default) to file
     * @return string Extracted plain text
     * @throws Exception
     */
    public function extract(string $storagePath): string
    {
        $fullPath = Storage::path($storagePath);

        if (!is_file($fullPath)) {
            throw new Exception('File not found at path: ' . $fullPath);
        }

        $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));

        if ($ext === 'pdf') {
            // Prefer system pdftotext if available for robust extraction
            if (defined('PHP_WINDOWS_VERSION_BUILD')) {
                // Windows: fallback to fallback extractor
                return $this->extractFromPdfFallback($fullPath);
            }

            $pdftotext = trim((string) shell_exec('which pdftotext'));
            if (!empty($pdftotext)) {
                $out = tempnam(sys_get_temp_dir(), 'pdftxt_');
                // Some systems require additional args for pdftotext encoding
                $cmd = escapeshellcmd($pdftotext) . ' -enc UTF-8 ' . escapeshellarg($fullPath) . ' ' . escapeshellarg($out);
                shell_exec($cmd);
                $text = @file_get_contents($out) ?: '';
                @unlink($out);
                if (trim($text) !== '') {
                    return $text;
                }
                // fallback if pdftotext produced empty string
            }

            // Fallback
            return $this->extractFromPdfFallback($fullPath);
        }

        if (in_array($ext, ['docx', 'doc'])) {
            try {
                $phpWord = IOFactory::load($fullPath);
                $text = '';

                foreach ($phpWord->getSections() as $section) {
                    // DOCX: Safely handle both Section and ContainerSection
                    if (method_exists($section, 'getElements')) {
                        $elements = $section->getElements();
                        foreach ($elements as $e) {
                            if (method_exists($e, 'getText')) {
                                $text .= $e->getText() . "\n";
                            } elseif (method_exists($e, 'getElements')) {
                                // Handle nested containers (tables, groups, etc.)
                                foreach ($e->getElements() as $innerEl) {
                                    if (method_exists($innerEl, 'getText')) {
                                        $text .= $innerEl->getText() . "\n";
                                    }
                                }
                            }
                        }
                    }
                }

                return trim($text);
            } catch (Exception $e) {
                throw new Exception('Failed to extract DOC/DOCX: ' . $e->getMessage());
            }
        }

        // Other types: attempt raw file_get_contents (not ideal)
        $raw = @file_get_contents($fullPath);
        if ($raw === false) {
            throw new Exception('Failed to read file: ' . $fullPath);
        }
        return (string) $raw;
    }

    private function extractFromPdfFallback(string $fullPath): string
    {
        // Lightweight fallback using stream and regex — poor quality but better than nothing.
        $contents = @file_get_contents($fullPath);
        if ($contents === false) {
            return '';
        }

        // Try to recover printable text (basic PDF, may not be perfect)
        // Remove binary/non-printable except printable, carriage return and newlines
        $contents = preg_replace('/[^\x20-\x7E\r\n\t]+/', '', $contents);
        return trim($contents);
    }
}
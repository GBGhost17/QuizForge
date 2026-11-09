import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '../ui/button';
import { Check, Copy, Download, QrCode, X } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  testTitle: string;
  joinCode: string;
}

export function QRCodeModal({ isOpen, onClose, testTitle, joinCode }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinUrl = `${window.location.origin}/join?code=${joinCode}`;

  useEffect(() => {
    if (isOpen && joinCode) {
      QRCode.toDataURL(joinUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => {
          setQrDataUrl(url);
          setError(null);
        })
        .catch(() => {
          setError('Không thể tạo mã QR lúc này.');
        });
    }
  }, [isOpen, joinCode, joinUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-PhongThi-${joinCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-3 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Mã QR Vào Phòng Thi
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 line-clamp-1 dark:text-slate-400">
              {testTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* QR Body */}
        <div className="flex flex-col items-center py-6">
          {error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : qrDataUrl ? (
            <div className="rounded-2xl border-4 border-indigo-100 bg-white p-4 shadow-inner dark:border-slate-800">
              <img
                src={qrDataUrl}
                alt={`Mã QR tham gia thi ${joinCode}`}
                className="h-64 w-64 object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="flex h-64 w-64 items-center justify-center text-sm text-slate-400">
              Đang tạo mã QR...
            </div>
          )}

          {/* Join Code Callout */}
          <div className="mt-4 text-center">
            <span className="text-xs uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">
              Mã phòng thi
            </span>
            <div className="mt-0.5 font-mono text-3xl font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400">
              {joinCode}
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-slate-500 max-w-xs dark:text-slate-400">
            Thí sinh có thể dùng Camera điện thoại hoặc Zalo quét mã QR để vào thi trực tiếp. Nếu
            chưa đăng nhập, hệ thống sẽ yêu cầu đăng nhập trước.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t dark:border-slate-800 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Đã chép link
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Chép liên kết
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex items-center justify-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Download className="h-3.5 w-3.5" /> Tải ảnh QR (PNG)
          </Button>
        </div>
      </div>
    </div>
  );
}

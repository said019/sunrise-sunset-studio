import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import type { PaymentRecord } from '@/types/payment';
import { Loader2, Search, FileImage, ExternalLink, FileText } from 'lucide-react';

interface PaymentsListProps {
  title?: string;
  description?: string;
  initialStatus?: string;
  statusLocked?: boolean;
  embedded?: boolean;
}

const statusLabels: Record<string, string> = {
  completed: 'Completado',
  pending: 'Pendiente',
  failed: 'Fallido',
  refunded: 'Reembolsado',
};

const statusStyles: Record<string, string> = {
  completed: 'bg-success/10 text-success border-success/30',
  pending: 'bg-warning/10 text-warning border-warning/30',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  refunded: 'bg-muted text-muted-foreground border-border',
};

const methodLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  online: 'En línea',
};

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

export default function PaymentsTransactions({
  title = 'Transacciones',
  description = 'Historial de pagos registrados.',
  initialStatus = 'all',
  statusLocked = false,
  embedded = false,
}: PaymentsListProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [proofPreview, setProofPreview] = useState<{ url: string; name: string; type: string | null } | null>(null);

  const { data, isLoading } = useQuery<PaymentRecord[]>({
    queryKey: ['payments', status, search, paymentMethod, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== 'all') params.append('status', status);
      if (search) params.append('search', search);
      if (paymentMethod !== 'all') params.append('paymentMethod', paymentMethod);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const { data } = await api.get(`/payments/transactions?${params.toString()}`);
      return data;
    },
  });

  const payments = useMemo(() => data || [], [data]);

  const clearFilters = () => {
    setSearch('');
    if (!statusLocked) setStatus('all');
    setPaymentMethod('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    Boolean(search) ||
    (!statusLocked && status !== 'all') ||
    paymentMethod !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate);

  const content = (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={status} onValueChange={setStatus} disabled={statusLocked}>
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="failed">Fallidas</SelectItem>
            <SelectItem value="refunded">Reembolsadas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los métodos</SelectItem>
            <SelectItem value="cash">Efectivo</SelectItem>
            <SelectItem value="transfer">Transferencia</SelectItem>
            <SelectItem value="card">Tarjeta</SelectItem>
            <SelectItem value="online">En línea</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground mb-1">Desde</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full md:w-40" />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground mb-1">Hasta</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full md:w-40" />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Membresía</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Comprobante</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay pagos registrados.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="font-medium">{payment.user_name}</div>
                    <div className="text-xs text-muted-foreground">{payment.user_email}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {payment.plan_name || '—'}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatCurrency(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell className="text-sm">{methodLabels[payment.payment_method] || payment.payment_method}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[payment.status]}>
                      {statusLabels[payment.status] || payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {payment.proof?.file_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProofPreview({
                          url: payment.proof!.file_url,
                          name: payment.proof!.file_name || 'Comprobante',
                          type: payment.proof!.file_type || null,
                        })}
                      >
                        <FileImage className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Proof preview dialog */}
      <Dialog open={!!proofPreview} onOpenChange={(open) => !open && setProofPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{proofPreview?.name}</DialogTitle>
          </DialogHeader>
          {proofPreview && (() => {
            const url = proofPreview.url;
            const isDriveUrl = url.includes('drive.google.com');
            const driveIdMatch = isDriveUrl ? url.match(/\/d\/([^/]+)/) : null;
            const driveFileId = driveIdMatch ? driveIdMatch[1] : null;
            const isPdf = url.startsWith('data:application/pdf') || proofPreview.type === 'application/pdf';
            const isImage = !isPdf && (url.startsWith('data:image/') || proofPreview.type?.startsWith('image/'));
            const imageSrc = driveFileId ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w2400` : url;

            return (
              <div className="space-y-3">
                {isImage && (
                  <img
                    src={imageSrc}
                    alt={proofPreview.name}
                    className="w-full max-h-[70vh] object-contain rounded-lg border"
                  />
                )}
                {isPdf && (
                  <div className="p-6 bg-muted rounded-lg flex items-center gap-3">
                    <FileText className="h-10 w-10 text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Documento PDF</p>
                      <p className="text-sm text-muted-foreground">
                        {isDriveUrl ? 'Abrir en Google Drive para ver el contenido completo.' : 'Documento adjunto.'}
                      </p>
                    </div>
                  </div>
                )}
                {isDriveUrl && (
                  <Button asChild variant="outline" className="w-full">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir en Drive
                    </a>
                  </Button>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );

  if (embedded) return content;

  return (
    <AuthGuard requiredRoles={['admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-heading font-bold">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {content}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

/** Embeddable version without layout wrapper */
export function TransactionsContent() {
  return <PaymentsTransactions embedded />;
}

export function PendingPaymentsContent() {
  return <PaymentsTransactions initialStatus="pending" statusLocked embedded />;
}

import { services, vehicleTypes, calculatePrice, timeSlots } from '@/data/services';
import { useBooking } from '@/hooks/useBooking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '@/lib/api';
import {
  ArrowLeft, ArrowRight, Check, Car, CarFront, Truck,
  Clock, Phone, User, Palette, CreditCard,
  Droplets, Sparkles, Shield, Wind, Loader2
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  droplets: Droplets,
  sparkles: Sparkles,
  shield: Shield,
  wind: Wind,
};

const vehicleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  car: Car,
  'car-front': CarFront,
  truck: Truck,
};

const steps = ['Serviço', 'Veículo', 'Data & Hora', 'Dados do Carro', 'Seus Dados', 'Confirmação'];

export default function BookingFlow() {
  const navigate = useNavigate();
  const { booking, setStep, setService, setVehicleType, setDate, setTime, setVehicleDetails, setClientDetails, reset } = useBooking();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const finalPrice = booking.service && booking.vehicleType
    ? calculatePrice(booking.service, booking.vehicleType) : 0;

  const handleConfirm = async () => {
    if (!booking.service || !booking.vehicleType || !booking.date || !booking.time) {
      toast.error('Preencha todos os campos!');
      return;
    }

    setLoading(true);
    try {
      await api.createBooking({
        organization_id: 'posto3l',
        customer: {
          name: booking.clientName,
          phone: booking.clientPhone
        },
        vehicle: {
          plate: booking.plate,
          model: booking.model,
          color: booking.color,
          type: booking.vehicleType.id as 'hatch' | 'sedan' | 'suv'
        },
        appointment: {
          service_id: booking.service.id,
          date: booking.date.toISOString(),
          time: booking.time,
          total_price: finalPrice
        }
      });
      setConfirmed(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao realizar agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (booking.step > 0) {
      setStep(booking.step - 1);
    } else {
      navigate('/');
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background px-5">
        <div className="text-center space-y-6 animate-fade-up max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Agendamento Confirmado!</h1>
          <p className="text-sm text-muted-foreground">Aguardamos você. Até breve!</p>
          <div className="bg-card rounded-2xl p-5 text-left space-y-3 border border-border">
            <Row label="Serviço" value={booking.service?.name || ''} />
            <Row label="Veículo" value={booking.vehicleType?.label || ''} />
            <Row label="Data" value={booking.date ? format(booking.date, "dd 'de' MMMM", { locale: ptBR }) : ''} />
            <Row label="Horário" value={booking.time || ''} />
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-primary">R$ {finalPrice},00</span>
            </div>
          </div>
          <div className="space-y-3">
            <Button variant="hero" size="lg" className="w-full" asChild>
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer">Voltar ao WhatsApp</a>
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => { reset(); setConfirmed(false); navigate('/'); }}>
              Início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 glass">
        <div className="max-w-lg mx-auto px-5 py-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={goBack} className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-medium text-muted-foreground">{steps[booking.step]}</span>
            <span className="text-xs text-muted-foreground">{booking.step + 1}/{steps.length}</span>
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${((booking.step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Step 0: Service */}
        {booking.step === 0 && (
          <div className="space-y-5 animate-fade-up">
            <div>
              <h2 className="text-xl font-bold text-foreground">Escolha o serviço</h2>
              <p className="text-sm text-muted-foreground mt-1">Selecione a lavagem desejada</p>
            </div>
            <div className="space-y-3">
              {services.map((s) => {
                const Icon = serviceIcons[s.icon] || Droplets;
                return (
                  <button
                    key={s.id}
                    onClick={() => setService(s)}
                    className="w-full bg-card border border-border hover:border-primary/30 rounded-2xl p-4 text-left transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground">{s.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm font-semibold text-primary">R$ {s.basePrice}+</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />{s.durationMinutes}min
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Vehicle Type */}
        {booking.step === 1 && (
          <div className="space-y-5 animate-fade-up">
            <div>
              <h2 className="text-xl font-bold text-foreground">Tipo de veículo</h2>
              <p className="text-sm text-muted-foreground mt-1">O preço varia por tamanho</p>
            </div>
            <div className="space-y-3">
              {vehicleTypes.map((v) => {
                const Icon = vehicleIcons[v.icon] || Car;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVehicleType(v)}
                    className="w-full bg-card border border-border hover:border-primary/30 rounded-2xl p-5 text-left transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-foreground">{v.label}</h3>
                        <p className="text-xs text-muted-foreground">{v.description}</p>
                      </div>
                      <span className="text-base font-bold text-primary">
                        R$ {booking.service ? calculatePrice(booking.service, v) : 0}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Calendar & Time */}
        {booking.step === 2 && (
          <div className="space-y-5 animate-fade-up">
            <div>
              <h2 className="text-xl font-bold text-foreground">Data & Horário</h2>
              <p className="text-sm text-muted-foreground mt-1">Escolha o melhor momento</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-3">
              <Calendar
                mode="single"
                selected={booking.date ?? undefined}
                onSelect={(d) => { if (d) setDate(d); }}
                locale={ptBR}
                disabled={(date) => date.getDay() === 0 || date < new Date(new Date().setHours(0,0,0,0))}
                className="pointer-events-auto mx-auto"
              />
            </div>
            {booking.date && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Horários em {format(booking.date, "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={cn(
                        "py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95",
                        booking.time === slot
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Vehicle Details */}
        {booking.step === 3 && (
          <div className="space-y-5 animate-fade-up">
            <div>
              <h2 className="text-xl font-bold text-foreground">Dados do veículo</h2>
              <p className="text-sm text-muted-foreground mt-1">Informe os dados do seu carro</p>
            </div>
            <div className="space-y-4">
              <FormField icon={Car} label="Placa">
                <Input placeholder="ABC-1234 ou ABC1D23" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} maxLength={8} className="bg-secondary border-border rounded-xl h-12" />
              </FormField>
              <FormField icon={Car} label="Modelo">
                <Input placeholder="Ex: Honda Civic 2022" value={model} onChange={(e) => setModel(e.target.value)} className="bg-secondary border-border rounded-xl h-12" />
              </FormField>
              <FormField icon={Palette} label="Cor" optional>
                <Input placeholder="Ex: Preto" value={color} onChange={(e) => setColor(e.target.value)} className="bg-secondary border-border rounded-xl h-12" />
              </FormField>
            </div>
            <Button variant="hero" size="lg" className="w-full" disabled={!plate || !model} onClick={() => setVehicleDetails(plate, model, color)}>
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 4: Client Details */}
        {booking.step === 4 && (
          <div className="space-y-5 animate-fade-up">
            <div>
              <h2 className="text-xl font-bold text-foreground">Seus dados</h2>
              <p className="text-sm text-muted-foreground mt-1">Informe seus dados de contato</p>
            </div>
            <div className="space-y-4">
              <FormField icon={User} label="Nome">
                <Input placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border rounded-xl h-12" />
              </FormField>
              <FormField icon={Phone} label="WhatsApp">
                <Input placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-secondary border-border rounded-xl h-12" />
              </FormField>
            </div>
            <Button variant="hero" size="lg" className="w-full" disabled={!name || !phone} onClick={() => setClientDetails(name, phone)}>
              Revisar agendamento <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {booking.step === 5 && (
          <div className="space-y-5 animate-fade-up">
            <div>
              <h2 className="text-xl font-bold text-foreground">Resumo</h2>
              <p className="text-sm text-muted-foreground mt-1">Confira antes de confirmar</p>
            </div>
            <div className="bg-card border border-border rounded-2xl divide-y divide-border">
              <Row label="Serviço" value={booking.service?.name || ''} />
              <Row label="Veículo" value={booking.vehicleType?.label || ''} />
              <Row label="Data" value={booking.date ? format(booking.date, "dd/MM/yyyy") : ''} />
              <Row label="Horário" value={booking.time || ''} />
              <Row label="Placa" value={booking.plate} />
              <Row label="Modelo" value={booking.model} />
              <Row label="Cliente" value={booking.clientName} />
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Total
                </span>
                <span className="text-xl font-bold text-primary">R$ {finalPrice},00</span>
              </div>
            </div>
            <Button variant="hero" size="lg" className="w-full" onClick={handleConfirm} disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function FormField({ icon: Icon, label, optional, children }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-primary" />
        {label} {optional && <span className="text-muted-foreground/50">(opcional)</span>}
      </label>
      {children}
    </div>
  );
}

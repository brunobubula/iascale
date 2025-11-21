import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock } from "lucide-react";
import { motion } from "framer-motion";

const formatCardNumber = (value) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

const formatExpiryDate = (value) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length >= 2) {
    return numbers.slice(0, 2) + '/' + numbers.slice(2, 4);
  }
  return numbers;
};

const getCardBrand = (number) => {
  const cleanNumber = number.replace(/\D/g, '');
  
  if (/^4/.test(cleanNumber)) return 'visa';
  if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
  if (/^3[47]/.test(cleanNumber)) return 'amex';
  if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
  if (/^36|38/.test(cleanNumber)) return 'diners';
  if (/^50|^60|^62/.test(cleanNumber)) return 'elo';
  
  return 'unknown';
};

export default function CreditCardForm({ onDataChange, cpfCnpj, phone }) {
  const [cardData, setCardData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
    postalCode: '',
    addressNumber: ''
  });

  const [cardBrand, setCardBrand] = useState('unknown');

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      const brand = getCardBrand(formatted);
      setCardBrand(brand);
      
      const cleanNumber = formatted.replace(/\s/g, '');
      const newData = { ...cardData, number: cleanNumber };
      setCardData(newData);
      
      validateAndNotify(newData);
    }
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.replace('/', '').length <= 4) {
      const parts = formatted.split('/');
      const newData = {
        ...cardData,
        expiryMonth: parts[0] || '',
        expiryYear: parts[1] || ''
      };
      setCardData(newData);
      validateAndNotify(newData);
    }
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      const newData = { ...cardData, ccv: value };
      setCardData(newData);
      validateAndNotify(newData);
    }
  };

  const handleFieldChange = (field, value) => {
    const newData = { ...cardData, [field]: value };
    setCardData(newData);
    validateAndNotify(newData);
  };

  const validateAndNotify = (data) => {
    const isValid = 
      data.holderName.length > 3 &&
      data.number.length === 16 &&
      data.expiryMonth.length === 2 &&
      data.expiryYear.length === 2 &&
      data.ccv.length >= 3 &&
      data.postalCode.length >= 8 &&
      data.addressNumber.length > 0;

    if (onDataChange) {
      onDataChange(isValid ? data : null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Card Preview */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-48 rounded-2xl p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <CreditCard className="w-10 h-10" />
            <div className="text-sm font-bold uppercase tracking-wider">
              {cardBrand !== 'unknown' ? cardBrand : 'CARTÃO'}
            </div>
          </div>

          <div>
            <div className="text-xl font-mono tracking-wider mb-4">
              {cardData.number ? formatCardNumber(cardData.number) : '•••• •••• •••• ••••'}
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] opacity-60 mb-1">TITULAR</div>
                <div className="text-sm font-semibold tracking-wide uppercase">
                  {cardData.holderName || 'SEU NOME'}
                </div>
              </div>
              <div>
                <div className="text-[10px] opacity-60 mb-1">VALIDADE</div>
                <div className="text-sm font-mono">
                  {cardData.expiryMonth && cardData.expiryYear
                    ? `${cardData.expiryMonth}/${cardData.expiryYear}`
                    : '••/••'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label className="text-slate-300 text-sm">Nome do Titular (como está no cartão)</Label>
          <Input
            type="text"
            value={cardData.holderName}
            onChange={(e) => handleFieldChange('holderName', e.target.value.toUpperCase())}
            placeholder="NOME COMPLETO"
            className="bg-slate-800/50 border-slate-700 text-white mt-1 uppercase"
          />
        </div>

        <div>
          <Label className="text-slate-300 text-sm">Número do Cartão</Label>
          <Input
            type="text"
            value={formatCardNumber(cardData.number)}
            onChange={handleCardNumberChange}
            placeholder="0000 0000 0000 0000"
            className="bg-slate-800/50 border-slate-700 text-white mt-1 font-mono text-lg tracking-wider"
            maxLength={19}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300 text-sm">Validade</Label>
            <Input
              type="text"
              value={`${cardData.expiryMonth}${cardData.expiryMonth && cardData.expiryYear ? '/' : ''}${cardData.expiryYear}`}
              onChange={handleExpiryChange}
              placeholder="MM/AA"
              className="bg-slate-800/50 border-slate-700 text-white mt-1 font-mono"
              maxLength={5}
            />
          </div>

          <div>
            <Label className="text-slate-300 text-sm flex items-center gap-1">
              CVV <Lock className="w-3 h-3" />
            </Label>
            <Input
              type="text"
              value={cardData.ccv}
              onChange={handleCvvChange}
              placeholder="000"
              className="bg-slate-800/50 border-slate-700 text-white mt-1 font-mono text-center text-lg"
              maxLength={4}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label className="text-slate-300 text-sm">CEP</Label>
            <Input
              type="text"
              value={cardData.postalCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 8) {
                  const formatted = value.replace(/(\d{5})(\d)/, '$1-$2');
                  handleFieldChange('postalCode', value);
                }
              }}
              placeholder="00000-000"
              className="bg-slate-800/50 border-slate-700 text-white mt-1"
              maxLength={9}
            />
          </div>

          <div>
            <Label className="text-slate-300 text-sm">Número</Label>
            <Input
              type="text"
              value={cardData.addressNumber}
              onChange={(e) => handleFieldChange('addressNumber', e.target.value)}
              placeholder="123"
              className="bg-slate-800/50 border-slate-700 text-white mt-1"
            />
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-800/30 rounded-lg p-3 border border-slate-700/30"
      >
        <Lock className="w-4 h-4 text-emerald-400" />
        <span>Pagamento 100% seguro processado via Asaas</span>
      </motion.div>
    </div>
  );
}
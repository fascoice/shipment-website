import React from 'react';
import { X, Printer, Globe, ShieldCheck, Mail, CheckCircle2, QrCode } from 'lucide-react';
import { Shipment } from '../types';
import wtoLogoImg from '../assets/images/wto_logo_white_bg.jpg';

interface WaybillModalProps {
  shipment: Shipment | null;
  onClose: () => void;
}

export const WaybillModal: React.FC<WaybillModalProps> = ({ shipment, onClose }) => {
  if (!shipment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-2xl border border-slate-300 relative my-8 print:shadow-none print:border-none print:m-0 print:p-4">
        
        {/* Close Button (Hidden on Print) */}
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-200 print:hidden">
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official Electronic Consignment Note & Waybill</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Waybill Document Body */}
        <div className="border-2 border-slate-900 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-900">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-900 pb-5">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img src={wtoLogoImg} alt="WTO Official Emblem" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-2xl font-black font-heading tracking-tight text-[#0F2942]">
                  WORLD TRANSPORT OVERSEAS (WTO)
                </h2>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">
                  International Worldwide Shipping & Express Multimodal Waybill
                </p>
                <p className="text-[11px] text-slate-500">
                  Global European HQ: Mimi Balkanska St 126, Sofia, Bulgaria | Worldwide Multimodal Cargo Network
                </p>
                <p className="text-[11px] text-slate-500">
                  Official Email: <strong>overseasworldtransport@gmail.com</strong>
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l-2 sm:border-slate-900 sm:pl-6">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Waybill / Consignment No.</span>
              <span className="text-xl font-mono font-black text-[#0F2942]">
                {shipment.trackingNumber}
              </span>
              <span className="block text-[11px] font-bold text-orange-600 mt-1 uppercase">
                {shipment.packageDetails.speed} Carrier Priority
              </span>
              <span className="text-[10px] text-slate-500 block">
                Issued: {shipment.createdDate}
              </span>
            </div>
          </div>

          {/* Simulated Barcode */}
          <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-300 flex items-center justify-between text-xs font-mono">
            <div className="flex flex-col space-y-0.5">
              <div className="flex space-x-0.5 h-7">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 3, 1, 2, 3].map((w, i) => (
                  <div key={i} className={`bg-slate-900 ${i % 2 === 0 ? 'opacity-100' : 'opacity-0'}`} style={{ width: `${w * 2.5}px` }}></div>
                ))}
              </div>
              <span className="text-[10px] text-slate-600 text-center tracking-widest">{shipment.trackingNumber}</span>
            </div>

            <div className="text-right text-[11px] font-sans">
              <span className="text-slate-500 block">Current Status:</span>
              <span className="font-extrabold uppercase text-[#0F2942] bg-white px-2 py-0.5 rounded border border-slate-300">
                {shipment.status}
              </span>
            </div>
          </div>

          {/* Sender & Receiver Dual Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-300 rounded-xl overflow-hidden text-xs">
            {/* Sender Box */}
            <div className="p-4 bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-300 space-y-1.5">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
                1. Sender (Origin of Consignment)
              </span>
              <p className="text-sm font-bold text-slate-900">{shipment.sender.name}</p>
              <p className="text-slate-700">{shipment.sender.address}</p>
              <p className="font-semibold text-slate-800">{shipment.sender.city}, {shipment.sender.state}</p>
              <p className="text-slate-600 font-mono">Phone: {shipment.sender.phone}</p>
              {shipment.sender.email && <p className="text-slate-600">Email: {shipment.sender.email}</p>}
            </div>

            {/* Receiver Box */}
            <div className="p-4 bg-slate-50 space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                2. Consignee / Receiver (Destination)
              </span>
              <p className="text-sm font-bold text-slate-900">{shipment.receiver.name}</p>
              <p className="text-slate-700">{shipment.receiver.address}</p>
              <p className="font-semibold text-slate-800">{shipment.receiver.city}, {shipment.receiver.state}</p>
              <p className="text-slate-600 font-mono">Phone: {shipment.receiver.phone}</p>
              {shipment.receiver.email && <p className="text-slate-600">Email: {shipment.receiver.email}</p>}
            </div>
          </div>

          {/* Package Details Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-200/80 font-bold uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="p-2.5">Cargo Description</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Qty</th>
                  <th className="p-2.5">Gross Weight</th>
                  <th className="p-2.5">Declared Value</th>
                  <th className="p-2.5 text-right">Freight Charges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-medium">{shipment.packageDetails.description || 'General Merchandise Cargo'}</td>
                  <td className="p-2.5">{shipment.packageDetails.type}</td>
                  <td className="p-2.5">{shipment.packageDetails.quantity}</td>
                  <td className="p-2.5 font-bold">{shipment.packageDetails.weight} kg</td>
                  <td className="p-2.5 font-semibold text-emerald-800">{shipment.packageDetails.value}</td>
                  <td className="p-2.5 text-right font-black font-mono text-sm text-[#0F2942]">
                    ${shipment.price.toLocaleString()} USD
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial & Terms Footnote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-[11px] text-slate-600">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">Payment Verification:</span>
              <p>
                All bank transfers, commercial clearances, and remittance confirmations are coordinated through official accounting email: <strong>overseasworldtransport@gmail.com</strong>.
              </p>
              <p className="font-mono text-slate-500">Ref: WTO-INV-{shipment.trackingNumber.slice(-6)}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Courier Agent Handover:</span>
                <p className="font-semibold text-slate-800">
                  {shipment.deliveryAgent ? `${shipment.deliveryAgent.name}` : 'WTO Authorized Express Dispatcher'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-[10px]">
                <span>Recipient Signature Handover: _________________</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-200">
            World Transport Overseas (WTO) • Mimi Balkanska St 126, 1517 Sofia, Bulgaria • overseasworldtransport@gmail.com
          </div>

        </div>

      </div>
    </div>
  );
};

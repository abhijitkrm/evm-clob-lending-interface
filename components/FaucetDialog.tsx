'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TokenFaucet from './TokenFaucet';

interface FaucetDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FaucetDialog({ isOpen, onClose }: FaucetDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-gray-900 tracking-tight">Test Token Faucet</DialogTitle>
          <DialogDescription className="text-gray-600 font-light tracking-wide">
            Get test tokens for interacting with the VeniceFi protocol
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <TokenFaucet isDialog={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

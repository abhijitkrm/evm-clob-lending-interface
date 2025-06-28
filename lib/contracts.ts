export const VENICE_FI_ABI = [
  // Read functions
  {
    name: 'loanOffers',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'lender', type: 'address' },
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'interestRate', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
      { name: 'collateralRatio', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'createdAt', type: 'uint256' }
    ]
  },
  {
    name: 'loanDemands',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'borrower', type: 'address' },
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'maxInterestRate', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
      { name: 'collateralAsset', type: 'address' },
      { name: 'collateralAmount', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'createdAt', type: 'uint256' }
    ]
  },
  {
    name: 'activeLoans',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'lender', type: 'address' },
      { name: 'borrower', type: 'address' },
      { name: 'asset', type: 'address' },
      { name: 'principal', type: 'uint256' },
      { name: 'interestRate', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'collateralAsset', type: 'address' },
      { name: 'collateralAmount', type: 'uint256' },
      { name: 'isRepaid', type: 'bool' },
      { name: 'isLiquidated', type: 'bool' }
    ]
  },
  {
    name: 'getUserOffers',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  {
    name: 'getUserDemands',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  {
    name: 'getUserLoans',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  {
    name: 'calculateInterest',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'principal', type: 'uint256' },
      { name: 'rate', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'nextOfferId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'nextDemandId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'nextLoanId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  
  // Write functions
  {
    name: 'createLoanOffer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'interestRate', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
      { name: 'collateralRatio', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'createLoanDemand',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'maxInterestRate', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
      { name: 'collateralAsset', type: 'address' },
      { name: 'collateralAmount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'matchLoan',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'offerId', type: 'uint256' },
      { name: 'demandId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'repayLoan',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'loanId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'cancelLoanOffer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'offerId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'cancelLoanDemand',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'demandId', type: 'uint256' }],
    outputs: []
  },
  
  // Events
  {
    name: 'LoanOfferCreated',
    type: 'event',
    inputs: [
      { name: 'offerId', type: 'uint256', indexed: true },
      { name: 'lender', type: 'address', indexed: true },
      { name: 'asset', type: 'address', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'rate', type: 'uint256', indexed: false }
    ]
  },
  {
    name: 'LoanDemandCreated',
    type: 'event',
    inputs: [
      { name: 'demandId', type: 'uint256', indexed: true },
      { name: 'borrower', type: 'address', indexed: true },
      { name: 'asset', type: 'address', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'maxRate', type: 'uint256', indexed: false }
    ]
  },
  {
    name: 'LoanMatched',
    type: 'event',
    inputs: [
      { name: 'loanId', type: 'uint256', indexed: true },
      { name: 'offerId', type: 'uint256', indexed: true },
      { name: 'demandId', type: 'uint256', indexed: true },
      { name: 'lender', type: 'address', indexed: false },
      { name: 'borrower', type: 'address', indexed: false }
    ]
  },
  {
    name: 'LoanRepaid',
    type: 'event',
    inputs: [
      { name: 'loanId', type: 'uint256', indexed: true },
      { name: 'borrower', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  },
  {
    name: 'OfferCancelled',
    type: 'event',
    inputs: [
      { name: 'offerId', type: 'uint256', indexed: true },
      { name: 'lender', type: 'address', indexed: true }
    ]
  },
  {
    name: 'DemandCancelled',
    type: 'event',
    inputs: [
      { name: 'demandId', type: 'uint256', indexed: true },
      { name: 'borrower', type: 'address', indexed: true }
    ]
  }
] as const;

export const ERC20_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "faucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

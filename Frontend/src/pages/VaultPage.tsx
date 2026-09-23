import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Plus,
  Search,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  ShieldAlert
} from 'lucide-react';
import { vaultService } from '../services/vaultService';
import { encryptPasswordPayload, decryptPasswordPayload, generateSecurePassword } from '../utils/cryptoUtils';
import type { VaultCredential } from '../types';
import { VaultSecurityAuditBanner } from '../components/vault/VaultSecurityAuditBanner';
import { useConfirm } from '../contexts/ConfirmDialogContext';

export const VaultPage: React.FC = () => {
  const confirm = useConfirm();
  const [credentials, setCredentials] = useState<VaultCredential[]>([]);
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [inputMasterPass, setInputMasterPass] = useState('');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedPassMap, setRevealedPassMap] = useState<Record<string, string>>({});
  const [visiblePassMap, setVisiblePassMap] = useState<Record<string, boolean>>({});

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [genPassModalOpen, setGenPassModalOpen] = useState(false);

  // Form State
  const [serviceName, setServiceName] = useState('');
  const [username, setUsername] = useState('');
  const [plaintextPass, setPlaintextPass] = useState('');
  const [category, setCategory] = useState('Development');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Password Generator State
  const [generatedPass, setGeneratedPass] = useState('');
  const [passLength, setPassLength] = useState(16);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    const data = await vaultService.getCredentials();
    setCredentials(data);
  };

  const handleUnlockVault = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMasterPass.trim()) return;
    setMasterPassword(inputMasterPass);
    setIsUnlocked(true);
  };

  const handleLockVault = () => {
    setIsUnlocked(false);
    setMasterPassword('');
    setInputMasterPass('');
    setRevealedPassMap({});
    setVisiblePassMap({});
  };

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !username || !plaintextPass || !masterPassword) return;

    try {
      const { ciphertext, iv, salt } = await encryptPasswordPayload(plaintextPass, masterPassword);
      const created = await vaultService.createCredential({
        serviceName,
        username,
        encryptedPassword: ciphertext,
        iv,
        salt,
        category,
        url: url || undefined,
        notes: notes || undefined
      });

      setCredentials((prev) => [created, ...prev]);

      // Cache decrypted password in local session state for instant view
      setRevealedPassMap(prev => ({ ...prev, [created.id]: plaintextPass }));

      // Reset form
      setServiceName('');
      setUsername('');
      setPlaintextPass('');
      setUrl('');
      setNotes('');
      setModalOpen(false);
    } catch (err) {
      console.error('Encryption failed:', err);
      alert('Encryption failed. Please verify your Master Password.');
    }
  };

  const handleDecryptPassword = async (cred: VaultCredential) => {
    if (revealedPassMap[cred.id]) {
      setVisiblePassMap(prev => ({ ...prev, [cred.id]: !prev[cred.id] }));
      return;
    }

    if (!cred.encryptedPassword || !cred.iv || !cred.salt) {
      alert('Credential payload missing cryptographic parameters');
      return;
    }

    try {
      const decrypted = await decryptPasswordPayload(cred.encryptedPassword, cred.iv, cred.salt, masterPassword);
      setRevealedPassMap(prev => ({ ...prev, [cred.id]: decrypted }));
      setVisiblePassMap(prev => ({ ...prev, [cred.id]: true }));
    } catch (err) {
      alert('Decryption failed. Ensure the Master Password matches the one used to encrypt this item.');
    }
  };

  const handleCopyPassword = async (cred: VaultCredential) => {
    let passToCopy = revealedPassMap[cred.id];

    if (!passToCopy && cred.encryptedPassword && cred.iv && cred.salt) {
      try {
        passToCopy = await decryptPasswordPayload(cred.encryptedPassword, cred.iv, cred.salt, masterPassword);
        setRevealedPassMap(prev => ({ ...prev, [cred.id]: passToCopy }));
      } catch (err) {
        alert('Decryption failed!');
        return;
      }
    }

    if (passToCopy) {
      await navigator.clipboard.writeText(passToCopy);
      setCopiedId(cred.id);
      setTimeout(() => setCopiedId(null), 3000);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    const ok = await confirm({
      title: 'Remove Credential',
      message: 'Are you sure you want to remove this credential record?',
      confirmText: 'Remove Credential',
      variant: 'danger',
    });
    if (!ok) return;
    await vaultService.deleteCredential(id);
    setCredentials(prev => prev.filter(c => c.id !== id));
  };

  const handleGenerateNewPassword = () => {
    const p = generateSecurePassword(passLength);
    setGeneratedPass(p);
  };

  const filteredCredentials = credentials.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      c.serviceName.toLowerCase().includes(s) ||
      c.username.toLowerCase().includes(s) ||
      (c.category && c.category.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Zero-Trust Password Vault
          </h1>
          <p className="text-xs sm:text-sm text-[#66736B] dark:text-[#9BB5A5] mt-1">
            Client-side Web Crypto (AES-256-GCM + PBKDF2). Passwords are encrypted before server transmission.
          </p>
        </div>

        {isUnlocked && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                handleGenerateNewPassword();
                setGenPassModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#E8F7EF] dark:bg-[#13261C] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-[#17211B] dark:text-[#EAF7EF] text-xs font-semibold border border-[#DCE9E1] dark:border-[#20372B] flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              Password Generator
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Credential
            </button>

            <button
              onClick={handleLockVault}
              className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
              title="Lock Vault Session"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Locked Vault Screen */}
      {!isUnlocked ? (
        <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-[#17211B] dark:text-[#EAF7EF]">Unlock Password Vault</h3>
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
              Enter your Master Password to derive your AES-256-GCM decryption key.
            </p>
          </div>

          <form onSubmit={handleUnlockVault} className="space-y-4">
            <input
              type="password"
              required
              autoFocus
              value={inputMasterPass}
              onChange={(e) => setInputMasterPass(e.target.value)}
              placeholder="Master Password..."
              className="w-full px-4 py-3 bg-[#E8F7EF] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-emerald-500 text-center tracking-widest placeholder:tracking-normal"
            />

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              Unlock Session
            </button>
          </form>

          <div className="p-3 rounded-xl bg-[#F3FBF7] dark:bg-[#08120D]/60 border border-[#DCE9E1] dark:border-[#20372B] text-[11px] text-[#8A9890] dark:text-[#6F8A7A] flex items-start gap-2 text-left">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>Master passwords are never sent or stored on the backend. Losing your master password will render encrypted credentials unrecoverable.</span>
          </div>
        </div>
      ) : (
        /* Unlocked Vault Content */
        <div className="space-y-5">
          {/* AI Credential Security & Vulnerability Audit Banner */}
          <VaultSecurityAuditBanner credentials={credentials} revealedPassMap={revealedPassMap} />

          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#66736B] dark:text-[#9BB5A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search credentials & accounts..."
              className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Credentials List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCredentials.map((cred) => {
              const isVisible = visiblePassMap[cred.id];
              const revealedPass = revealedPassMap[cred.id] || '••••••••••••••••';

              return (
                <div
                  key={cred.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] shadow-xl space-y-3 transition-all relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-sm truncate max-w-[160px]">{cred.serviceName}</h4>
                        <span className="text-[10px] font-semibold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider">{cred.category || 'Account'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCredential(cred.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-[#8A9890] dark:text-[#6F8A7A] hover:text-rose-400 hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg transition-all"
                      title="Delete Credential"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="text-xs text-[#66736B] dark:text-[#9BB5A5] flex items-center justify-between">
                      <span>Username / Email</span>
                      <span className="font-mono text-[#17211B] dark:text-[#EAF7EF] select-all">{cred.username}</span>
                    </div>

                    <div className="text-xs text-[#66736B] dark:text-[#9BB5A5] flex items-center justify-between bg-[#F3FBF7] dark:bg-[#08120D]/60 p-2 rounded-xl border border-[#DCE9E1] dark:border-[#20372B]">
                      <span className="font-mono text-[#17211B] dark:text-[#EAF7EF] select-all">
                        {isVisible ? revealedPass : '••••••••••••••••'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDecryptPassword(cred)}
                          className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-colors"
                          title={isVisible ? 'Hide Password' : 'Show Password'}
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopyPassword(cred)}
                          className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-emerald-400 transition-colors"
                          title="Copy Password"
                        >
                          {copiedId === cred.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {cred.url && (
                    <div className="pt-2 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between text-xs">
                      <a
                        href={cred.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#5FBF8F] hover:text-brand-300 flex items-center gap-1 text-[11px] truncate max-w-[200px]"
                      >
                        {cred.url} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Credential Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3FBF7] dark:bg-[#08120D]/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between">
              <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Add Encrypted Credential
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCredential} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1">
                  Service / Website Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. GitHub Enterprise"
                  className="w-full px-3 py-2 bg-[#E8F7EF] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1">
                  Username / Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dev@company.com"
                  className="w-full px-3 py-2 bg-[#E8F7EF] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1">
                  Plaintext Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={plaintextPass}
                    onChange={(e) => setPlaintextPass(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full px-3 py-2 bg-[#E8F7EF] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setPlaintextPass(generateSecurePassword(16))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-[#5FBF8F] text-white px-2 py-1 rounded-md hover:bg-[#237A57] transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#E8F7EF] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1">
                    URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-[#E8F7EF] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
                >
                  Encrypt & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Generator Tool Modal */}
      {genPassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3FBF7] dark:bg-[#08120D]/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Password Generator Tool
              </h3>
              <button onClick={() => setGenPassModalOpen(false)} className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F3FBF7] dark:bg-[#08120D] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl font-mono text-center text-sm font-bold text-emerald-400 select-all tracking-wider">
              {generatedPass}
            </div>

            <div className="flex items-center justify-between text-xs text-[#66736B] dark:text-[#9BB5A5]">
              <span>Length: {passLength}</span>
              <input
                type="range"
                min="8"
                max="32"
                value={passLength}
                onChange={(e) => {
                  setPassLength(Number(e.target.value));
                  setGeneratedPass(generateSecurePassword(Number(e.target.value)));
                }}
                className="w-32"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleGenerateNewPassword}
                className="flex-1 py-2 bg-[#E8F7EF] dark:bg-[#13261C] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-[#17211B] dark:text-[#EAF7EF] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-generate
              </button>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(generatedPass);
                  alert('Password copied to clipboard!');
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

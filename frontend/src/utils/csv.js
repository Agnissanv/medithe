export function exportCommandesToCsv(commandes) {
  const headers = [
    'Numéro', 'Date', 'Nom', 'Téléphone',
    'Adresse', 'Produits', 'Total', 'Statut', 'Notes',
  ];

  const lignes = commandes.map((c) => [
    c.NumeroCommande,
    new Date(c.DateHeure).toLocaleString('fr-FR'),
    c.Nom,
    c.Telephone,
    c.Quartier,
    c.Produits.map((p) => `${p.nom} x${p.quantite}`).join(' | '),
    c.MontantTotal,
    c.Statut,
    c.NotesCallCenter || '',
  ]);

  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const csv = [headers, ...lignes].map((ligne) => ligne.map(escape).join(',')).join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `medithe_commandes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

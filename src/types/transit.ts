export type ChequeDirection = 'EMIS' | 'RECU';

export type ChequeCategory = 
  | 'CAUTION_CONTENEUR'    // Consignation conteneur maritime (caution à récupérer)
  | 'DROITS_DOUANE'        // Droits et taxes Trésor Public / Douane
  | 'FRAIS_MARITIMES'      // Fret, échange B/L, BAD, frais d'escale, surestaries
  | 'MANUTENTION_PORT'     // Acconage, magasinage terminal, pesage VGM, scanner
  | 'TRANSPORT_TRACTION'   // Transporteur routier / traction port-client
  | 'AVANCE_PROVISION'     // Provision reçue du client importateur
  | 'HONORAIRES_TRANSIT'   // Rémunération de la prestation transitaire
  | 'AUTRE_DEBOURS';       // Frais vétérinaires, phytosanitaires, escorte, etc.

export type ChequeStatus =
  | 'BROUILLON'           // En préparation / validation financière
  | 'EMIS'                // Chèque signé en caisse
  | 'REMIS_COURSIER'      // Remis au déclarant / coursier pour dépôt
  | 'DEPOSE'              // Déposé au guichet (compagnie, douane, port, banque)
  | 'DECAISSE'            // Débit bancaire confirmé (pour chèque émis)
  | 'ENCAISSE'            // Crédit bancaire confirmé (pour chèque reçu)
  | 'A_RECUPERER'         // Caution conteneur: conteneur vide rendu, chèque en attente de déconsignation
  | 'RECUPERE'            // Chèque de caution physique récupéré / déconsigné / détruit
  | 'ANNULE'              // Chèque annulé ou remplacé
  | 'LITIGE';             // Contestation surestaries, chèque égaré ou rejeté

export type ContainerRestitutionStatus = 
  | 'CHEZ_CLIENT'         // Conteneur en cours de déchargement chez le client
  | 'VIDE_RESTITUE'       // Conteneur vide retourné au parc sous douane (avec EIR)
  | 'SURESTARIE_RISQUE';  // Franchise dépassée ou imminente

export interface ContainerInfo {
  containerNumbers: string[];
  containerType: '20_DRY' | '40_DRY' | '40_HC' | 'REEFER' | 'OPEN_TOP' | 'AUTRE';
  shippingLine: string;       // ex: "CMA CGM", "MSC", "Maersk", "Hapag-Lloyd", "Cosco"
  franchiseDays: number;      // ex: 14 jours
  restitutionDeadline: string;// Date limite de retour vide
  actualReturnDate?: string;  // Date effective retour
  interchangeNumber?: string; // EIR (Equipment Interchange Receipt)
  depotLocation?: string;     // ex: "Parc à Conteneurs Sud - Terminal 2"
  restitutionStatus: ContainerRestitutionStatus;
  deconsignationRequestDate?: string;
}

export interface ChequeAuditLog {
  id: string;
  date: string;
  action: string;
  actor: string;
  comment?: string;
}

export interface TransitCheque {
  id: string;
  chequeNumber: string;
  bankName: string;
  direction: ChequeDirection;
  category: ChequeCategory;
  amount: number;
  currency: string;
  dossierNumber: string;      // Réf Dossier Transit (ex: DOS-2026-084)
  clientName: string;         // Nom du client importateur/exportateur
  beneficiary: string;        // Bénéficiaire (Compagnie maritime, Douane, Port, etc.)
  dateEmission: string;       // Date d'émission
  dateEcheance?: string;      // Date d'échéance / validité
  dateRemiseCoursier?: string;
  coursierName?: string;      // Nom du déclarant/coursier
  dateEncaissement?: string;  // Date de débit ou encaissement effectif
  status: ChequeStatus;
  containerInfo?: ContainerInfo;
  observations?: string;
  attachmentsCount?: number;
  auditTrail: ChequeAuditLog[];
}

export type DossierStatus = 
  | 'RECEPTIONNE'         // Dossier réceptionné à l'agence / documents reçus
  | 'OUVERT'              // Ouvert / En cours de constitution & préparation
  | 'EN_DEDOUANEMENT'     // En cours de déclaration / visite douane
  | 'BON_A_DELIVRER'      // Bon à Délivrer (BAD) obtenu
  | 'SORTI_PORT'          // Marchandise sortie du port / livrée
  | 'SOLDE_ARCHIVE';      // Dossier financièrement soldé & archivé

export interface TransitDossier {
  id: string;
  dossierNumber: string;
  clientName: string;
  clientContact?: string;
  regime: 'IMPORT_DIRECT' | 'EXPORT' | 'TRANSIT_SOUS_DOUANE' | 'ADMISSION_TEMPORAIRE' | 'ENTREPOT';
  blNumber: string;            // Bill of Lading (Connaissement) ou LTA (Lettre de Transport Aérien)
  declarationNumber?: string;  // N° Déclaration en Douane (DUM / DAU / Sommier)
  vesselName?: string;         // Nom du navire ou N° de vol
  eta?: string;                // Date arrivée prévue
  berthingDate?: string;       // Date d'accostage du navire au port
  bankReceptionDate?: string;  // Date de réception du dossier par la banque
  portOfDischarge: string;     // Port / Aéroport
  goodsDescription: string;    // Désignation marchandise
  containerCount: number;
  status: DossierStatus;
  openedDate: string;
  totalProvisionsReceived?: number;
}

export interface FilterState {
  search: string;
  status: ChequeStatus | 'ALL';
  category: ChequeCategory | 'ALL';
  direction: ChequeDirection | 'ALL';
  beneficiary?: string;
  bank?: string;
  shippingLine: string;
  dossier: string;
  period: 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'OVERDUE_CAUTION';
}


// Basic reusable primitives
export interface Composer {
  composerId: number;
  firstName?: string;
  middleName?: string;
  lastName: string;
  fullName?: string; // optional, can be computed on FE if needed
}

export interface Vendor {
  vendorId: number;
  vendorName: string;
  streetAddress?: string;
  city?: string;
  stateAbbr?: string;
  zipCode?: string;
  phoneNumber?: string;
  phoneType?: string;
  website?: string;
  email?: string;
  createdAt?: string;
  createdBy?: Account;
  updatedAt?: string;
  updatedBy?: Account;
}

// For lists that need "existing" data (no full entity)
export type ExistingComposer = Omit<Composer, 'fullName'>;

// Arrangement Type (mirrors backend)
export interface ArrangementType {
  code: string;
  name?: string;
}

// Part (mirrors your Part entity/DTO)
export interface Part {
  partId?: number;
  instrument: string;
  hasSolo: boolean;
  regularPartCount: number;
  flexMinPart?: number | null;
  flexPartCount?: number | null;
  partComments?: string | null;
}

// ScoreComposer (for the many-to-many contribution)
export interface ScoreComposer {
  scoreComposerId?: number;
  scoreId?: number;
  composer: Composer;           // full nested on response
  contributionType: string;     // "COMPOSER" | "ARRANGER" | "LYRICIST" | "OTHER"
}

// Tag
export interface ScoreTag {
  scoreTagId?: number;
  scoreId?: number;
  tag: string;
}

// Medley (mirrors your backend Medley model)
export interface Medley {
  medleyId?: number;
  scoreId?: number;
  pieceTitle: string;
  composer: Composer;           // full nested on backend responses
}

// For editing forms (flat composerId — what MedleyList & ComposerList actually use)
export interface MedleyEntry extends Omit<Medley, 'composer'> {
  composerId?: number;          // flat for UI
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
}

export interface ComposerEntry {
  composerId?: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  contributionType: string;
}

// Main Score shapes

// Full response from GET /scores/{id} or similar (backend MusicScore)
export interface MusicScore {
  scoreId: number;
  scoreTitle: string;
  scoreSubtitle?: string;
  owner: {
    accountId: number;
    accountName: string;
  };
  purchasedFrom?: Vendor;
  purchasedDate?: string;       // or Date if you parse it
  purchasedCost?: number;
  grade?: number;
  arrangementType: ArrangementType;
  scoreComposers: ScoreComposer[];
  parts: Part[];
  scoreTags: ScoreTag[];
  medleys: Medley[];            // nested composer from backend
  updatedAt: string;
  updatedBy: {
    accountId: number;
    accountName: string;
  };
}

// For Create payload (POST /scores) — slightly lighter
export interface CreateScoreRequest {
  scoreTitle: string;
  scoreSubtitle?: string | null;
  owner: { accountId: number };
  purchasedFrom?: Vendor | null;
  purchasedDate?: string | null;
  purchasedCost?: number | null;
  grade?: number | null;
  arrangementType: { code: string };
  scoreComposers: {
    composer: { composerId: number };
    contributionType: string;
  }[];
  parts: Omit<Part, 'partId'>[];           // no partId on create
  scoreTags: { tag: string }[];
  medleys: {
    pieceTitle: string;
    composer: { composerId: number } | null;
  }[];
}
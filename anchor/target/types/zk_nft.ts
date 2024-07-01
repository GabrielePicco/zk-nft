export type ZkNft = {
  "version": "0.1.0",
  "name": "zk_nft",
  "instructions": [
    {
      "name": "createGroup",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "maxSize",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createAsset",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupAuthority",
          "isMut": false,
          "isSigner": true,
          "isOptional": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "recipient",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "cpiAuthorityPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "selfProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lightSystemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "accountCompressionProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "registeredProgramPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "noopProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "accountCompressionAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "defined": "CompressedProof"
          }
        },
        {
          "name": "baseDataSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "newAddressParamsPacked",
          "type": {
            "defined": "NewAddressParams"
          }
        },
        {
          "name": "blobParams",
          "type": {
            "option": {
              "defined": "BlobParams"
            }
          }
        },
        {
          "name": "attributesParams",
          "type": {
            "option": {
              "defined": "AttributesParams"
            }
          }
        }
      ]
    },
    {
      "name": "transfer",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "recipient",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "cpiAuthorityPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "selfProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lightSystemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "accountCompressionProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "registeredProgramPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "noopProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "accountCompressionAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "defined": "CompressedProof"
          }
        },
        {
          "name": "assetId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "baseData",
          "type": {
            "defined": "BaseData"
          }
        },
        {
          "name": "baseDataInput",
          "type": {
            "defined": "PackedInputCompressedPda"
          }
        }
      ]
    },
    {
      "name": "uploadBlob",
      "accounts": [
        {
          "name": "uploadedBlob",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u32"
        },
        {
          "name": "bytes",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "initBlobUpload",
      "accounts": [
        {
          "name": "uploadedBlob",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "totalBytes",
          "type": "u32"
        }
      ]
    },
    {
      "name": "logBlob",
      "accounts": [
        {
          "name": "uploadedBlob",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "noopProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "registeredProgram",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "registeredProgramId",
            "type": "publicKey"
          },
          {
            "name": "groupAuthorityPda",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "group",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "size",
            "type": "u64"
          },
          {
            "name": "maxSize",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "uploadedBlob",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CompressedProof",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "a",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "b",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "c",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "PackedMerkleContext",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "merkleTreePubkeyIndex",
            "type": "u8"
          },
          {
            "name": "nullifierQueuePubkeyIndex",
            "type": "u8"
          },
          {
            "name": "leafIndex",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "AttributesParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "data",
            "type": {
              "vec": {
                "defined": "Attribute"
              }
            }
          },
          {
            "name": "proof",
            "type": {
              "defined": "CompressedProof"
            }
          }
        ]
      }
    },
    {
      "name": "BlobParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "data",
            "type": {
              "defined": "Blob"
            }
          },
          {
            "name": "proof",
            "type": {
              "defined": "CompressedProof"
            }
          }
        ]
      }
    },
    {
      "name": "Attribute",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "traitType",
            "type": "string"
          },
          {
            "name": "value",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "BaseData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "delegate",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "delegateRole",
            "type": {
              "defined": "DelegateRole"
            }
          },
          {
            "name": "state",
            "type": {
              "defined": "State"
            }
          }
        ]
      }
    },
    {
      "name": "DelegateRole",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "All"
          },
          {
            "name": "Transfer"
          },
          {
            "name": "Lock"
          },
          {
            "name": "Burn"
          },
          {
            "name": "TransferAndLock"
          },
          {
            "name": "TransferAndBurn"
          },
          {
            "name": "LockAndBurn"
          }
        ]
      }
    },
    {
      "name": "State",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Unlocked"
          },
          {
            "name": "LockedByAuthority"
          },
          {
            "name": "LockedByDelegate"
          }
        ]
      }
    },
    {
      "name": "Blob",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contentType",
            "type": "string"
          },
          {
            "name": "txSig",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    },
    {
      "name": "NewAddressParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "addressQueueAccountIndex",
            "type": "u8"
          },
          {
            "name": "addressMerkleTreeAccountIndex",
            "type": "u8"
          },
          {
            "name": "addressMerkleTreeRootIndex",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "PackedInputCompressedPda",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "merkleContext",
            "type": {
              "defined": "PackedMerkleContext"
            }
          },
          {
            "name": "rootIndex",
            "type": "u16"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "OwnerUpdatedEvent",
      "fields": [
        {
          "name": "assetId",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "GroupMaxSizeExceeded",
      "msg": "GroupMaxSizeExceeded"
    },
    {
      "code": 6001,
      "name": "AssetNotMutable",
      "msg": "AssetNotMutable"
    },
    {
      "code": 6002,
      "name": "AssetIsLocked",
      "msg": "AssetIsLocked"
    },
    {
      "code": 6003,
      "name": "InvalidAuthority",
      "msg": "Authority is not the owner or delegate"
    }
  ]
};

export const IDL: ZkNft = {
  "version": "0.1.0",
  "name": "zk_nft",
  "instructions": [
    {
      "name": "createGroup",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "maxSize",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createAsset",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupAuthority",
          "isMut": false,
          "isSigner": true,
          "isOptional": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "recipient",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "cpiAuthorityPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "selfProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lightSystemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "accountCompressionProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "registeredProgramPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "noopProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "accountCompressionAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "defined": "CompressedProof"
          }
        },
        {
          "name": "baseDataSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "newAddressParamsPacked",
          "type": {
            "defined": "NewAddressParams"
          }
        },
        {
          "name": "blobParams",
          "type": {
            "option": {
              "defined": "BlobParams"
            }
          }
        },
        {
          "name": "attributesParams",
          "type": {
            "option": {
              "defined": "AttributesParams"
            }
          }
        }
      ]
    },
    {
      "name": "transfer",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "recipient",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "cpiAuthorityPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "selfProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lightSystemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "accountCompressionProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "registeredProgramPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "noopProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "accountCompressionAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "defined": "CompressedProof"
          }
        },
        {
          "name": "assetId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "baseData",
          "type": {
            "defined": "BaseData"
          }
        },
        {
          "name": "baseDataInput",
          "type": {
            "defined": "PackedInputCompressedPda"
          }
        }
      ]
    },
    {
      "name": "uploadBlob",
      "accounts": [
        {
          "name": "uploadedBlob",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u32"
        },
        {
          "name": "bytes",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "initBlobUpload",
      "accounts": [
        {
          "name": "uploadedBlob",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "totalBytes",
          "type": "u32"
        }
      ]
    },
    {
      "name": "logBlob",
      "accounts": [
        {
          "name": "uploadedBlob",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "noopProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "registeredProgram",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "registeredProgramId",
            "type": "publicKey"
          },
          {
            "name": "groupAuthorityPda",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "group",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "size",
            "type": "u64"
          },
          {
            "name": "maxSize",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "uploadedBlob",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CompressedProof",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "a",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "b",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "c",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "PackedMerkleContext",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "merkleTreePubkeyIndex",
            "type": "u8"
          },
          {
            "name": "nullifierQueuePubkeyIndex",
            "type": "u8"
          },
          {
            "name": "leafIndex",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "AttributesParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "data",
            "type": {
              "vec": {
                "defined": "Attribute"
              }
            }
          },
          {
            "name": "proof",
            "type": {
              "defined": "CompressedProof"
            }
          }
        ]
      }
    },
    {
      "name": "BlobParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "data",
            "type": {
              "defined": "Blob"
            }
          },
          {
            "name": "proof",
            "type": {
              "defined": "CompressedProof"
            }
          }
        ]
      }
    },
    {
      "name": "Attribute",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "traitType",
            "type": "string"
          },
          {
            "name": "value",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "BaseData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "delegate",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "delegateRole",
            "type": {
              "defined": "DelegateRole"
            }
          },
          {
            "name": "state",
            "type": {
              "defined": "State"
            }
          }
        ]
      }
    },
    {
      "name": "DelegateRole",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "All"
          },
          {
            "name": "Transfer"
          },
          {
            "name": "Lock"
          },
          {
            "name": "Burn"
          },
          {
            "name": "TransferAndLock"
          },
          {
            "name": "TransferAndBurn"
          },
          {
            "name": "LockAndBurn"
          }
        ]
      }
    },
    {
      "name": "State",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Unlocked"
          },
          {
            "name": "LockedByAuthority"
          },
          {
            "name": "LockedByDelegate"
          }
        ]
      }
    },
    {
      "name": "Blob",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contentType",
            "type": "string"
          },
          {
            "name": "txSig",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    },
    {
      "name": "NewAddressParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "addressQueueAccountIndex",
            "type": "u8"
          },
          {
            "name": "addressMerkleTreeAccountIndex",
            "type": "u8"
          },
          {
            "name": "addressMerkleTreeRootIndex",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "PackedInputCompressedPda",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "merkleContext",
            "type": {
              "defined": "PackedMerkleContext"
            }
          },
          {
            "name": "rootIndex",
            "type": "u16"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "OwnerUpdatedEvent",
      "fields": [
        {
          "name": "assetId",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
          "type": "publicKey",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "GroupMaxSizeExceeded",
      "msg": "GroupMaxSizeExceeded"
    },
    {
      "code": 6001,
      "name": "AssetNotMutable",
      "msg": "AssetNotMutable"
    },
    {
      "code": 6002,
      "name": "AssetIsLocked",
      "msg": "AssetIsLocked"
    },
    {
      "code": 6003,
      "name": "InvalidAuthority",
      "msg": "Authority is not the owner or delegate"
    }
  ]
};

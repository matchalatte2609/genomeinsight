// GenomeInsight MongoDB Database Initialization
// Collections for genomic variant data and population genetics

// Switch to genomeinsight database
use genomeinsight;

// Create variants collection with indexes
db.createCollection("variants", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["chromosome", "position", "ref_allele", "alt_allele", "dataset_id"],
            properties: {
                _id: { bsonType: "objectId" },
                dataset_id: { bsonType: "string" },
                chromosome: { bsonType: "string" },
                position: { bsonType: "long" },
                ref_allele: { bsonType: "string" },
                alt_allele: { bsonType: "string" },
                variant_id: { bsonType: "string" }, // rs number or custom ID
                gene_symbol: { bsonType: "string" },
                gene_id: { bsonType: "string" },
                transcript_id: { bsonType: "string" },
                protein_change: { bsonType: "string" },
                consequence: { bsonType: "string" },
                clinical_significance: { bsonType: "string" },
                populations: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["name", "allele_frequency", "sample_count"],
                        properties: {
                            name: { bsonType: "string" },
                            allele_frequency: { bsonType: "double" },
                            allele_count: { bsonType: "int" },
                            sample_count: { bsonType: "int" },
                            hardy_weinberg_p: { bsonType: "double" },
                            heterozygosity: { bsonType: "double" }
                        }
                    }
                },
                quality_metrics: {
                    bsonType: "object",
                    properties: {
                        quality_score: { bsonType: "double" },
                        depth: { bsonType: "int" },
                        mapping_quality: { bsonType: "double" },
                        strand_bias: { bsonType: "double" },
                        allele_balance: { bsonType: "double" }
                    }
                },
                annotations: {
                    bsonType: "object",
                    properties: {
                        sift_score: { bsonType: "double" },
                        polyphen_score: { bsonType: "double" },
                        cadd_score: { bsonType: "double" },
                        gnomad_frequency: { bsonType: "double" },
                        clinvar_id: { bsonType: "string" },
                        dbsnp_id: { bsonType: "string" }
                    }
                },
                created_at: { bsonType: "date" },
                updated_at: { bsonType: "date" }
            }
        }
    }
});

// Create indexes for variants collection
db.variants.createIndex({ "dataset_id": 1 });
db.variants.createIndex({ "chromosome": 1, "position": 1 });
db.variants.createIndex({ "variant_id": 1 });
db.variants.createIndex({ "gene_symbol": 1 });
db.variants.createIndex({ "clinical_significance": 1 });
db.variants.createIndex({ "populations.name": 1 });
db.variants.createIndex({ "populations.allele_frequency": 1 });

// Compound indexes for common queries
db.variants.createIndex({ "chromosome": 1, "position": 1, "ref_allele": 1, "alt_allele": 1 });
db.variants.createIndex({ "dataset_id": 1, "chromosome": 1 });
db.variants.createIndex({ "dataset_id": 1, "gene_symbol": 1 });

// Create samples collection
db.createCollection("samples", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["sample_id", "dataset_id", "population"],
            properties: {
                _id: { bsonType: "objectId" },
                sample_id: { bsonType: "string" },
                dataset_id: { bsonType: "string" },
                population: { bsonType: "string" },
                sex: { bsonType: "string", enum: ["male", "female", "unknown"] },
                ancestry: { bsonType: "string" },
                phenotypes: {
                    bsonType: "array",
                    items: { bsonType: "string" }
                },
                metadata: { bsonType: "object" },
                genotype_quality_stats: {
                    bsonType: "object",
                    properties: {
                        call_rate: { bsonType: "double" },
                        het_ratio: { bsonType: "double" },
                        ti_tv_ratio: { bsonType: "double" }
                    }
                },
                created_at: { bsonType: "date" }
            }
        }
    }
});

// Create indexes for samples
db.samples.createIndex({ "dataset_id": 1 });
db.samples.createIndex({ "sample_id": 1 });
db.samples.createIndex({ "population": 1 });
db.samples.createIndex({ "dataset_id": 1, "population": 1 });

// Create analysis_results collection for storing computed results
db.createCollection("analysis_results", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["analysis_id", "dataset_id", "analysis_type"],
            properties: {
                _id: { bsonType: "objectId" },
                analysis_id: { bsonType: "string" },
                dataset_id: { bsonType: "string" },
                analysis_type: { bsonType: "string" },
                results: { bsonType: "object" },
                summary_stats: { bsonType: "object" },
                plots_data: { bsonType: "object" },
                created_at: { bsonType: "date" }
            }
        }
    }
});

// Create indexes for analysis results
db.analysis_results.createIndex({ "analysis_id": 1 });
db.analysis_results.createIndex({ "dataset_id": 1 });
db.analysis_results.createIndex({ "analysis_type": 1 });

// Insert sample variant data for testing
db.variants.insertOne({
    dataset_id: "sample-dataset-001",
    chromosome: "1",
    position: NumberLong(230710048),
    ref_allele: "A",
    alt_allele: "G",
    variant_id: "rs429358",
    gene_symbol: "APOE",
    gene_id: "ENSG00000130203",
    consequence: "missense_variant",
    clinical_significance: "pathogenic",
    populations: [
        {
            name: "European",
            allele_frequency: 0.136,
            allele_count: 272,
            sample_count: 1000,
            hardy_weinberg_p: 0.85,
            heterozygosity: 0.23
        },
        {
            name: "African",
            allele_frequency: 0.197,
            allele_count: 394,
            sample_count: 1000,
            hardy_weinberg_p: 0.72,
            heterozygosity: 0.31
        }
    ],
    annotations: {
        sift_score: 0.02,
        polyphen_score: 0.98,
        cadd_score: 25.3,
        gnomad_frequency: 0.154,
        clinvar_id: "RCV000019455",
        dbsnp_id: "rs429358"
    },
    created_at: new Date(),
    updated_at: new Date()
});

print("MongoDB collections created successfully!");
print("Collections: " + db.getCollectionNames());

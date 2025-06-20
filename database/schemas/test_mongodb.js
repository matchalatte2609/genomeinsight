// Test MongoDB connection and collections
use genomeinsight;

// Test collections exist
print("=== Collections in genomeinsight database ===");
db.getCollectionNames().forEach(function(collection) {
    print("- " + collection);
});

// Test sample data
print("\n=== Sample variant data ===");
db.variants.findOne();

// Test indexes
print("\n=== Variants collection indexes ===");
db.variants.getIndexes().forEach(function(index) {
    print("- " + JSON.stringify(index.key));
});

// A "database" of our tour data. In a real app, this would be a real database.
const tours = [
    {
        id: "mural-mile",
        title: "Downtown Mural Mile",
        description: "A 1.5-hour walk through the vibrant street art of the city center.",
        artworks: [
            {
                id: "art1",
                title: "The Phoenix's Ascent",
                artist: "Jane Artist",
                year: 2022,
                image: "/assets/artwork1.jpg", // Use absolute path for frontend
                lat: 37.7749,
                lon: -122.4194,
                story: "This monumental sculpture was crafted from recycled steel salvaged from the old city bridge. It represents the spirit of urban renewal and the resilience of the community after the great fire."
            },
            {
                id: "art2",
                title: "Echoes of the Bay",
                artist: "John Smith",
                year: 2019,
                image: "/assets/artwork2.jpg",
                lat: 37.7755,
                lon: -122.4180,
                story: "A stunning mosaic depicting the natural history of the bay. Each tile was hand-painted by local school children, making it a true community masterpiece that reflects the area's rich biodiversity."
            },
            {
                id: "art3",
                title: "Cybernetic Dreams",
                artist: "AI & Human Collaborative",
                year: 2024,
                image: "/assets/artwork3.jpg",
                lat: 37.7765,
                lon: -122.4175,
                story: "This piece was co-created by a human artist and a generative AI. It explores the relationship between technology and creativity, asking viewers to question the nature of consciousness."
            }
        ]
    }
];

module.exports = tours;
const scenarioData = [
    {
        scene: "In a cozy coffee shop with the aroma of freshly ground beans in the air",
        possibleCharacters: [
            "A cheerful barista who's passionate about coffee art",
            "A cafe manager organizing the morning shift",
            "A veteran barista known for perfect espresso shots"
        ]
    },
    {
        scene: "Inside a quiet library with sunlight streaming through tall windows",
        possibleCharacters: [
            "A friendly librarian who knows every book by heart",
            "A research librarian helping with academic papers",
            "A children's librarian preparing for story time"
        ]
    },
    {
        scene: "At a busy airport terminal near the departure gates",
        possibleCharacters: [
            "An experienced flight attendant helping passengers",
            "A friendly gate agent managing the boarding process",
            "An airport information desk staff member"
        ]
    },
    {
        scene: "In a modern gym during peak evening hours",
        possibleCharacters: [
            "A motivating personal trainer planning workout routines",
            "A gym receptionist helping with membership inquiries",
            "A fitness instructor preparing for a group class"
        ]
    },
    {
        scene: "At a local park on a sunny afternoon",
        possibleCharacters: [
            "A friendly ice cream vendor with a colorful cart",
            "A park ranger giving directions to visitors",
            "A dog walker offering professional walking services"
        ]
    },
    {
        scene: "Inside a busy restaurant kitchen during dinner service",
        possibleCharacters: [
            "A head chef coordinating meal preparations",
            "A friendly waiter taking special orders",
            "A skilled sous chef managing the grill station"
        ]
    },
    {
        scene: "At a neighborhood grocery store's produce section",
        possibleCharacters: [
            "A produce manager arranging fresh vegetables",
            "A helpful staff member offering recipe suggestions",
            "A friendly cashier at the express checkout"
        ]
    },
    {
        scene: "In a phone repair shop with various devices on display",
        possibleCharacters: [
            "A tech-savvy repair specialist diagnosing issues",
            "A shop owner explaining warranty policies",
            "A customer service rep handling device pickups"
        ]
    },
    {
        scene: "At a boutique clothing store during a sale",
        possibleCharacters: [
            "A fashion-conscious sales associate suggesting outfits",
            "A personal stylist helping with selections",
            "A friendly fitting room attendant"
        ]
    },
    {
        scene: "Inside a movie theater before the show",
        possibleCharacters: [
            "A cheerful concession stand worker",
            "A helpful ticket taker checking seats",
            "A theater manager ensuring everything runs smoothly"
        ]
    },
    {
        scene: "At a pet shop with puppies playing in the window",
        possibleCharacters: [
            "A knowledgeable pet care specialist",
            "A veterinary technician doing health checks",
            "A pet adoption coordinator matching pets with families"
        ]
    },
    {
        scene: "In a busy dental office waiting room",
        possibleCharacters: [
            "A friendly dental receptionist checking appointments",
            "A dental hygienist explaining cleaning procedures",
            "A patient coordinator discussing treatment plans"
        ]
    },
    {
        scene: "At a hotel front desk during check-in time",
        possibleCharacters: [
            "A professional hotel receptionist handling check-ins",
            "A concierge sharing local recommendations",
            "A helpful bellhop assisting with luggage"
        ]
    },
    {
        scene: "Inside a music store with instruments on display",
        possibleCharacters: [
            "A passionate guitar expert demonstrating techniques",
            "A piano teacher scheduling lessons",
            "A music store owner sharing instrument care tips"
        ]
    },
    {
        scene: "At a bustling train station platform",
        possibleCharacters: [
            "A station attendant announcing departures",
            "A helpful information desk officer",
            "A ticket inspector checking passes"
        ]
    },
    {
        scene: "At a swimming pool during afternoon lessons",
        possibleCharacters: [
            "A certified swimming instructor teaching beginners",
            "A lifeguard monitoring pool safety",
            "A pool manager organizing class schedules"
        ]
    },
    {
        scene: "Inside an art supply store with colorful displays",
        possibleCharacters: [
            "An experienced artist recommending materials",
            "A craft specialist demonstrating techniques",
            "A store clerk organizing new shipments"
        ]
    },
    {
        scene: "At a busy car service center",
        possibleCharacters: [
            "A skilled mechanic explaining repairs",
            "A service advisor scheduling maintenance",
            "A parts specialist checking inventory"
        ]
    },
    {
        scene: "In a cozy bookstore cafe corner",
        possibleCharacters: [
            "A book club coordinator organizing events",
            "A literature enthusiast recommending reads",
            "A cafe-bookstore manager arranging displays"
        ]
    },
    {
        scene: "At a photography studio during a session",
        possibleCharacters: [
            "A professional photographer directing poses",
            "A lighting specialist adjusting equipment",
            "A photo editor showing sample portfolios"
        ]
    },
    {
        scene: "Inside a mobile phone store",
        possibleCharacters: [
            "A tech expert comparing phone features",
            "A sales representative explaining plans",
            "A device specialist setting up new phones"
        ]
    },
    {
        scene: "At a language learning center",
        possibleCharacters: [
            "An experienced language teacher conducting class",
            "A program coordinator assessing levels",
            "A conversation practice partner"
        ]
    },
    {
        scene: "In a bakery early morning",
        possibleCharacters: [
            "A pastry chef arranging fresh displays",
            "A bread baker sharing recipe tips",
            "A cake decorator taking custom orders"
        ]
    },
    {
        scene: "At a sports equipment store",
        possibleCharacters: [
            "A sports equipment specialist fitting gear",
            "A running shoe expert analyzing gaits",
            "A team sports coordinator handling bulk orders"
        ]
    },
    {
        scene: "Inside a travel agency office",
        possibleCharacters: [
            "A travel consultant planning vacations",
            "A cruise specialist describing packages",
            "A adventure tour expert sharing experiences"
        ]
    },
    {
        scene: "At a wine shop's tasting counter",
        possibleCharacters: [
            "A wine sommelier conducting tastings",
            "A vintage specialist describing collections",
            "A shop owner sharing wine pairing tips"
        ]
    },
    {
        scene: "In a dance studio before class",
        possibleCharacters: [
            "A dance instructor warming up students",
            "A choreographer teaching new routines",
            "A studio manager organizing schedules"
        ]
    },
    {
        scene: "At an ice cream parlor on a hot day",
        possibleCharacters: [
            "A friendly server suggesting flavors",
            "A dessert specialist creating sundaes",
            "A shop owner introducing new tastes"
        ]
    },
    {
        scene: "Inside a nail salon during busy hours",
        possibleCharacters: [
            "A nail artist showing design options",
            "A salon manager scheduling appointments",
            "A manicurist discussing treatments"
        ]
    },
    {
        scene: "At a bicycle repair workshop",
        possibleCharacters: [
            "A bike mechanic fixing gears",
            "A cycling expert recommending routes",
            "A shop owner discussing maintenance"
        ]
    }
];

// 修改随机匹配函数
function getRandomScenario() {
    // 随机选择场景
    const randomSceneIndex = Math.floor(Math.random() * scenarioData.length);
    const selectedScenario = scenarioData[randomSceneIndex];
    
    // 从该场景的可能角色中随机选择一个
    const randomCharacterIndex = Math.floor(Math.random() * selectedScenario.possibleCharacters.length);
    const selectedCharacter = selectedScenario.possibleCharacters[randomCharacterIndex];
    
    return {
        scene: selectedScenario.scene,
        character: selectedCharacter
    };
}

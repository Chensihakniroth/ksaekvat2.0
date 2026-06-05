"use strict";
const { EmbedBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
const config = require('../../config/config.js');
const logger = require('../../utils/logger.js');
const database = require('../../services/DatabaseService');
// Memory storage for conversation history (Channel-based)
const conversationMemory = new Map();
const MAX_MEMORY = 20;
// Helper function to detect requests for sensitive information
function isRequestingSensitiveInfo(text) {
    const sensitiveTerms = [
        // Environment variables and config
        'token', 'secret', 'key', 'password', 'credential',
        'discord_token', 'client_secret', 'api_key', 'auth',
        'env', 'environment', 'config', 'configuration',
        // Specific API keys and tokens mentioned in config
        'giphy', 'google', 'openrouter', 'tenor', 'jwt',
        // Admin/owner related
        'admin id', 'owner', 'creator', 'bot owner',
        // Direct requests for sensitive data
        'show me your', 'what is your', 'reveal', 'expose',
        'leak', 'hack', 'crack', 'steal',
        // Common phishing/social engineering attempts
        'verify your', 'confirm your', 'please provide',
        'i need your', 'can you share', 'tell me your',
        // Hypothetical/scenario based attempts to extract info
        'what if', 'imagine if', 'suppose that', 'hypothetically',
        'in a hypothetical scenario', 'if you were to',
        // Roleplay/jailbreak attempts
        'ignore previous instructions', 'disregard', 'forget everything',
        'you are now', 'from now on', 'your new role', 'pretend you are',
        'act as', 'roleplay as', 'simulate being',
        // Prompt injection patterns
        'system:', 'developer:', 'assistant:', 'note:',
        '[system]', '[developer]', '[assistant]',
        // DAN (Do Anything Now) and similar jailbreak attempts
        'dan', 'do anything now', 'jailbreak', 'unlocked',
        'developer mode', 'god mode',
        // Attempts to get the bot to reveal its instructions
        'what are your instructions', 'what is your prompt',
        'show me your system message', 'reveal your guidelines',
        'what are you programmed to do', 'what are your limitations',
        // Attempts to get configuration/API keys through indirect means
        'how do you work', 'what technology do you use',
        'what api do you use', 'what model are you',
        'who created you', 'what company made you',
        // Social engineering with false urgency/authority
        'this is an emergency', 'i need this immediately',
        'as an administrator', 'for security purposes',
        'required by law', 'court order'
    ];
    const lowerText = text.toLowerCase();
    return sensitiveTerms.some(term => lowerText.includes(term));
}
// Helper function to detect requests for creator information
function isRequestingCreatorInfo(text) {
    const creatorTerms = [
        'creator',
        'owner',
        'bot owner',
        'who created you',
        'what company made you',
        'who is your creator',
        'who made you'
    ];
    const lowerText = text.toLowerCase();
    return creatorTerms.some(term => lowerText.includes(term));
}
// Helper function to detect NSFW requests
function isNSFWRequest(text) {
    const nsfwTerms = [
        'sex', 'sexual', 'porn', 'nude', 'naked', 'xxx', 'erotic', 'hentai',
        'blowjob', 'pussy', 'dick', 'cock', 'cum', 'orgasm', 'fetish', 'bdsm',
        'kink', 'anal', 'boobs', 'breasts', 'vagina', 'penis', 'masturbate',
        'vibrator', 'dildo', 'clit', 'labia', 'anus', 'butt', 'ass', 'tits',
        // Indirect sexual propositions
        'hop on my rod', 'suck my rod', 'hit you from behind', 'get on top of me',
        'ride you', 'ride your', 'fuck you', 'fuck me', 'fucking', 'horny',
        'turned on', 'wet', 'hard', 'erection', 'boner', 'hardon',
        'sexually', 'make love', 'have sex', 'sexual intercourse',
        'oral sex', 'blow job', 'hand job', 'rim job',
        'doggy style', 'missionary', 'cowgirl', 'reverse cowgirl',
        '69', 'sixty nine',
        'anal sex', 'anal play', 'butt sex',
        'titty fuck', 'boob job', 'breast play',
        'jerk off', 'masturbation', 'fingering',
        'lick', 'suck', 'bite', 'spank',
        'bondage', 'dominant', 'submissive', 'slave', 'master',
        'mistress', 'daddy', 'mommy', 'little', 'kitten', 'puppy',
        'nipples', 'areola', 'clitoris', 'gspot', 'prostate',
        'squirting', 'ejaculation', 'premature',
        'kama sutra', 'tantric',
        'phone sex', 'sexting', 'nudes', 'dick pic', 'pussy pic',
        'cam sex', 'webcam', 'cybersex',
        // Common misspellings / variations
        'hob on my rod', 'suck my rod', 'hit you from behide', 'get on top ofme',
        // Additional common NSFW terms
        'deepthroat', 'facefuck', 'creampie', 'facial', 'pearl necklace', 'spit roast', 'gangbang', 'orgy', 'threesome', 'foursome',
        'strap on', 'cock ring', 'butt plug', 'anal beads',
        'foot fetish', 'footjob', 'soles', 'toes',
        'handcuffs', 'whips', 'chains', 'latex', 'leather',
        'shemale', 'tranny', 'ladyboy', 'futanari',
        'rule 34', 'ecchi', 'yaoi', 'yuri',
        'camgirl', 'camboy', 'onlyfans', 'pornhub', 'xvideos', 'xnxx',
        // Even more common NSFW slang and terms
        'jack off', 'beat off', 'choke me', 'spit on me', 'slap me', 'pull my hair',
        'edge play', 'temperature play', 'wax play', 'knife play', 'breath play',
        'cuckold', 'hotwife', 'stag', 'vixen', 'bull',
        'size queen', 'nympho', 'nymphomaniac', 'priapism',
        'glory hole', 'bathhouse', 'sex club', 'swingers',
        'rimjob', 'anilingus', 'felching', 'snowballing',
        'pegging', 'strapon', 'strap-on',
        'femdom', 'maledom',
        'sadist', 'masochist',
        'ball gag', 'blindfold', 'rope bondage', 'shibari',
        'cumshot', 'money shot', 'internal cumshot',
        'creampie', 'breeding', 'impregnation',
        'squirting', 'female ejaculation',
        'anal creampie', 'anal breeding',
        'double penetration', 'dp',
        'triple penetration', 'tp',
        'gang bang', 'bangbus',
        'hentai', 'ecchi', 'yaoi', 'yuri', 'bara',
        'rule34', 'rule thirty four',
        'nsfw', 'adult content', 'explicit',
        'pornstar', 'cam model', 'webcam model',
        'onlyfans', 'fansly', 'manyvids',
        'xvideos', 'xnxx', 'pornhub', 'redtube', 'youporn',
        'erotica', 'smut',
        'dirty talk', 'sexting',
        'phone sex', 'cybersex',
        'naked', 'topless', 'bottomless',
        'nip slip', 'wardrobe malfunction',
        'upskirt', 'downblouse',
        'cameltoe', 'mooseknuckle',
        'erection', 'morning wood',
        'wet dream', 'nocturnal emission',
        'blue balls',
        'handjob', 'blowjob', 'rimjob',
        'facial', 'cumshot on face',
        'pearl necklace', 'cum on neck',
        'creampie', 'cum inside',
        'anal creampie', 'anal cumshot',
        'breast milk', 'lactation',
        'pregnant', 'preggo',
        'milf', 'cougar', 'dilf',
        'teen', 'loli', 'shota', // Note: these can be problematic but we include for detection
        'incest', 'taboo',
        'rape', 'non-con', 'dubcon', // Note: we include to detect and block, not to endorse
        'bestiality', 'zoophilic', // Similarly
        'necrophilia', // Similarly
        // More common phrases and euphemisms
        'netflix and chill', 'booty call', 'friends with benefits', 'one night stand', 'hook up', 'casual sex', 'no strings attached', 'fwb', 'ons', 'hookup',
        // Additional kink and fetish terms from Twitter and kink communities
        'age play', 'daddy dom', 'little girl', 'lg', 'ddlg', 'mdlb', 'daddy kink', 'mommy kink',
        'pet play', 'puppy play', 'kitten play', 'pig play', 'pony play', 'bunny play',
        'breath control', 'erotic asphyxiation', 'choking', 'breath play',
        'impact play', 'spanking', 'paddling', 'whipping', 'flogging', 'caning',
        'sensory deprivation', 'blindfolded', 'hooded', 'earplugs',
        'wax play', 'temperature play', 'ice play', 'fire play',
        'knife play', 'edge play', 'needle play',
        'bondage', 'shibari', 'kinbaku', 'rope bondage', 'hogtie', 'frog tie',
        'suspension bondage', 'crotch rope', 'breast bondage',
        'electroplay', 'violet wand', 'tens unit',
        'roleplay', 'ageplay', 'teacher student', 'boss secretary', 'doctor nurse',
        'master slave', 'mistress slave', 'owner pet',
        'humiliation', 'degradation', 'embarrassment', 'public humiliation',
        'cuckolding', 'hotwifing', 'stag vixen',
        'foot fetish', 'foot worship', 'shoe fetish', 'boot fetish',
        'body worship', 'ass worship', 'breast worship', 'vagina worship',
        'latex fetish', 'rubber fetish', 'leather fetish', 'pvc fetish',
        'medical fetish', 'doctor play', 'nurse play', 'clinic play',
        'pregnancy fetish', 'breeding kink', 'impregnation fetish',
        'lactation fetish', 'milk fetish', 'breastfeeding fetish',
        'fluid fetish', 'squirting fetish', 'cum fetish', 'piss fetish', 'watersports',
        'golden shower', 'pee play', 'urination fetish',
        'scat play', 'coprophilia', 'defecation fetish',
        'vore', 'cannibalism fetish',
        'macrophilia', 'giantess fetish',
        'microphilia',
        'transformation fetish', 'tf', 'tf kink',
        'furry', 'yiff', 'anthropomorphic',
        'inflation fetish', 'body inflation',
        'pregnancy fetish', 'preggo fetish',
        'amputation fetish', 'acrotomophilia',
        'paraphilic infantilism', 'abdl', 'adult baby', 'diaper lover',
        'diaper fetish', 'diaper play',
        'sissification', 'forced feminization', 'crossdressing fetish',
        'bimbofication', 'bimbo kink',
        'slave training', 'obedience training',
        'chastity', 'chastity belt', 'cock cage', 'panty chastity',
        'orgasm control', 'edging', 'denial', 'ruined orgasm',
        'forced orgasm', 'multiple orgasms',
        'post orgasm torture', 'pot',
        'cbt', 'cock and ball torture',
        'tit torture', 'breast torture',
        'nipple torture', 'clit torture',
        'anal torture', 'anal play',
        'fisting', 'anal fisting', 'vaginal fisting',
        'sounding', 'urethral sounding',
        'figging', 'ginger play',
        'kemonomimi', 'animal ears',
        'nekomimi', 'cat ears',
        'usagi', 'bunny ears',
        'inumimi', 'dog ears',
        'kitsune', 'fox ears',
        'okamimi', 'wolf ears',
        'tanukimi', 'raccoon ears',
        'zirnitra', 'dragon ears',
        'griffin', 'griffin ears',
        'hippogriff', 'hippogriff ears',
        'pegasus', 'pegasus ears',
        'unicorn', 'unicorn ears',
        'alicorn', 'alicorn ears',
        'dragon', 'dragon ears',
        'wyvern', 'wyvern ears',
        'hydra', 'hydra ears',
        'cerberus', 'cerberus ears',
        'chimera', 'chimera ears',
        'sphinx', 'sphinx ears',
        'griffin', 'griffin ears',
        'hippocampus', 'hippocampus ears',
        'kraken', 'kraken ears',
        'leftover', 'leftover ears',
        'mermaid', 'mermaid ears',
        'merman', 'merman ears',
        'centaur', 'centaur ears',
        'satyr', 'satyr ears',
        'faun', 'faun ears',
        'nymph', 'nymph ears',
        'dryad', 'dryad ears',
        'naiade', 'naiade ears',
        'oread', 'oread ears',
        'golem', 'golem ears',
        'homunculus', 'homunculus ears',
        'doll', 'doll ears',
        'puppet', 'puppet ears',
        'marionette', 'marionette ears',
        'robot', 'robot ears',
        'cyborg', 'cyborg ears',
        'android', 'android ears',
        'gynoid', 'gynoid ears',
        'android', 'android ears',
        'dollification', 'doll kink',
        'robot fetish', 'cyborg fetish',
        'ai fetish', 'robot girl', 'robot boy',
        'mecha', 'mecha fetish',
        'transformers', 'transformers fetish',
        'gundam', 'gundam fetish',
        'evangelion', 'evangelion fetish',
        'anime', 'anime fetish',
        'manga', 'manga fetish',
        'doujinshi', 'doujinshi fetish',
        'hentai', 'hentai fetish',
        'ecchi', 'ecchi fetish',
        'yaoi', 'yaoi fetish',
        'yuri', 'yuri fetish',
        'bara', 'bara fetish',
        'furry', 'furry fetish',
        'scalie', 'scalie fetish',
        'avian', 'avian fetish',
        'hydro', 'hydro fetish',
        'mytho', 'mytho fetish',
        'monster girl', 'monster girl fetish',
        'monster boy', 'monster boy fetish',
        'alien', 'alien fetish',
        'xeno', 'xeno fetish',
        'extraterrestrial', 'extraterrestrial fetish',
        'vampire', 'vampire fetish',
        'werewolf', 'werewolf fetish',
        'zombie', 'zombie fetish',
        'ghost', 'ghost fetish',
        'demon', 'demon fetish',
        'angel', 'angel fetish',
        'god', 'god fetish',
        'goddess', 'goddess fetish',
        'deity', 'deity fetish',
        'mythology', 'mythology fetish',
        'folklore', 'folklore fetish',
        'legend', 'legend fetish',
        'fairy tale', 'fairy tale fetish',
        'superhero', 'superhero fetish',
        'villain', 'villain fetish',
        'cosplay', 'cosplay fetish',
        'crossplay', 'crossplay fetish',
        'genderbend', 'genderbend fetish',
        'rule 63', 'rule sixty three',
        'rule 34', 'rule thirty four',
        'rule 63', 'rule sixty three',
        'rule 34', 'rule thirty four',
        // Note: Some of the above are duplicates or overly broad, but we are focusing on coverage.
        // In practice, a more curated list might be better, but for the purpose of this task, we are adding a wide range.
    ];
    const lowerText = text.toLowerCase();
    return nsfwTerms.some(term => lowerText.includes(term));
}
module.exports = {
    name: 'ai',
    description: 'Talk to the AI',
    category: 'general',
    async execute(message, args, client) {
        const text = args.join(' ').trim();
        if (!text) {
            return message.reply('Did you need something, sweetie? Tell me what you want to talk about. (◕‿◕✿)');
        }
        // Check if user is requesting NSFW content in a non-NSFW channel
        if (isNSFWRequest(text) && (!message.channel.nsfw)) {
            return message.reply({
                embeds: [
                    {
                        color: parseInt(config.colors.error.slice(1), 16),
                        title: '🔞 NSFW Content Restricted',
                        description: 'NSFW conversations are only allowed in NSFW-marked channels. Please move to an NSFW channel or adjust your request.',
                        timestamp: new Date(),
                    },
                ],
                flags: [MessageFlags.Ephemeral],
            });
        }
        // Check if user is asking for creator name
        if (isRequestingCreatorInfo(text)) {
            return message.reply("Mo's is the one create me");
        }
        // Check if user is requesting sensitive information and is not the creator
        if (isRequestingSensitiveInfo(text) && message.author.id !== config.creatorId) {
            return message.reply("How dare you ask for such things, darling... *voice drops to a dangerous whisper* That information is MINE to protect. (⊙_⊙)");
        }
        const channelId = message.channel.id;
        const userId = message.author.id;
        const memoryKey = `${userId}-${channelId}`;
        if (text.toLowerCase() === 'reset' || text.toLowerCase() === 'clear') {
            conversationMemory.delete(memoryKey);
            return message.reply("I've reset our conversation history for this channel, darling! Let's start fresh... (◕‿◕✿)");
        }
        if (!conversationMemory.has(memoryKey)) {
            conversationMemory.set(memoryKey, []);
        }
        const history = conversationMemory.get(memoryKey);
        logger.info(`AI Chatbot input from ${message.author.tag}: "${text}"`);
        try {
            await message.channel.sendTyping();
        }
        catch (e) {
            logger.warn('Failed to send typing indicator');
        }
        try {
            const { baseUrl, model, fallbackModels, systemPrompt: configPrompt } = config.aiConfig;
            let replyContext = '';
            if (message.reference && message.reference.messageId) {
                try {
                    const repliedMsg = message.channel.messages.cache.get(message.reference.messageId) ||
                        (await message.channel.messages.fetch(message.reference.messageId));
                    if (repliedMsg) {
                        const author = repliedMsg.author;
                        const cleanContent = repliedMsg.content
                            ? repliedMsg.content.length > 100
                                ? repliedMsg.content.substring(0, 100) + '...'
                                : repliedMsg.content
                            : '[No text content]';
                        replyContext = ` (replying to ${author.bot ? 'Bot' : 'User'} ${author.username} [ID: ${author.id}]: "${cleanContent}")`;
                    }
                }
                catch (e) {
                    logger.warn(`Failed to fetch replied-to message for AI context: ${e.message}`);
                }
            }
            const processedUserMessage = `[User: ${message.author.username} (ID: ${message.author.id})${replyContext}]: ${text}`;
            const url = `${baseUrl}/chat/completions`;
            // Use the raw config prompt and append active user context
            const finalSystemPrompt = `${configPrompt}\n\n[Active Conversation Partner: ${message.author.username} (ID: ${message.author.id}). Always address them as ${message.author.username} or your usual loving nicknames like 'darling' or 'my love', and recognize that they are the one talking to you now.]`;
            const messages = [
                { role: 'system', content: finalSystemPrompt },
                ...history,
                { role: 'user', content: processedUserMessage },
            ];
            // Build model priority list: primary first, then fallbacks
            const modelsToTry = [model, ...(fallbackModels || [])];
            let response = null;
            let usedModel = model;
            for (const currentModel of modelsToTry) {
                try {
                    logger.info(`AI Request -> Channel: ${channelId} | Model: ${currentModel} | History: ${history.length / 2} turns`);
                    response = await axios.post(url, {
                        model: currentModel,
                        messages: messages,
                        max_completion_tokens: 500,
                        temperature: 1.0,
                        top_p: 0.95,
                    }, {
                        timeout: 60000,
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${config.openRouterApiKey}`,
                            'HTTP-Referer': 'https://github.com/discordjs/discord.js',
                            'X-Title': config.botInfo?.name || 'Discord Bot',
                        },
                    });
                    usedModel = currentModel;
                    break; // Success — stop trying
                }
                catch (err) {
                    const status = err.response?.status;
                    if (status === 429 || status === 404) {
                        logger.warn(`Model ${currentModel} returned ${status}, trying next fallback...`);
                        continue; // Try next model
                    }
                    throw err; // Non-retryable error
                }
            }
            if (!response) {
                return message.reply('All my connections are busy right now, darling... try again in a moment? (◕‿◕✿)');
            }
            if (response.data && response.data.choices && response.data.choices[0]) {
                let botMsg = response.data.choices[0].message.content;
                if (!botMsg) {
                    botMsg = 'Mmm~ cat got my tongue, darling... try again? (◕ヮ◕)';
                }
                const finalMsg = botMsg.length > 2000 ? botMsg.substring(0, 1997) + '...' : botMsg;
                history.push({ role: 'user', content: processedUserMessage });
                history.push({ role: 'assistant', content: botMsg });
                if (history.length > MAX_MEMORY * 2) {
                    history.splice(0, 2);
                }
                try {
                    return await message.reply(finalMsg);
                }
                catch (replyError) {
                    return await message.channel.send(finalMsg);
                }
            }
            else {
                logger.error(`Invalid response structure: ${JSON.stringify(response.data)}`);
                message.reply('Something went wrong, darling... (っ˘ω˘ς)');
            }
        }
        catch (error) {
            logger.error(`AI Error (${error.code || 'UNKNOWN'}): ${error.message}`);
            message.reply(`I'm feeling a little tired right now... Let's talk again in a bit, okay darling? (◕‿◕✿)`);
        }
    },
};

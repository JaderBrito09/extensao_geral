// src/sidepanel/skills.js
import { appendMessageUI } from './ui.js';
import { historyEl } from './ui.js';

export const DEFAULT_SKILL_KEY = "gestaogov";
export let activeSkillKey = DEFAULT_SKILL_KEY;
export let currentSkillReferences = "";
export let currentSkillTemplates = "";

let skillsConfig = {};
const SKILLS_CACHE_TTL_MS = 3600 * 1000;

function parseSkillMarkdown(mdText, skillId) {
    let label = skillId, category = "Governança", description = "", userGuidance = "", systemPrompt = "";
    const titleMatch = mdText.match(/^#\s*Skill:\s*(.+)$/m);
    if (titleMatch) label = titleMatch[1].trim();
    const catMatch = mdText.match(/^\*\*Categoria\*\*:\s*(.+)$/m);
    if (catMatch) category = catMatch[1].trim();
    const descMatch = mdText.match(/^\*\*Descrição\*\*:\s*(.+)$/m);
    if (descMatch) description = descMatch[1].trim();
    const guidanceSection = mdText.split(/##\s*Orientação Inicial ao Usuário/i)[1];
    if (guidanceSection) userGuidance = guidanceSection.split(/##\s*System Prompt/i)[0].trim();
    const systemSection = mdText.split(/##\s*System Prompt/i)[1];
    systemPrompt = systemSection ? systemSection.trim() : mdText;
    return { id: skillId, slug: skillId, label, category, description, userGuidance, systemPrompt, references: [], templates: [] };
}

async function fetchWithFallback(remoteUrl, localPath) {
    try {
        const resp = await fetch(remoteUrl);
        if (resp.ok) return resp;
    } catch (e) {
        console.warn(`[Skills] Fetch remoto falhou para ${remoteUrl}, tentando fallback.`);
    }
    const fallbackUrl = (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
        ? chrome.runtime.getURL(localPath)
        : './' + localPath;
    return fetch(fallbackUrl);
}

export async function carregarReferenciasSkill(referencesList = []) {
    currentSkillReferences = "";
    if (!referencesList || !Array.isArray(referencesList) || referencesList.length === 0) {
        return;
    }

    try {
        const fetchPromises = referencesList.map(async (refPath) => {
            const rawRefUrl = `https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/${refPath}`;
            const resp = await fetchWithFallback(rawRefUrl, `skills-repo/${refPath}`);
            if (resp.ok) {
                const text = await resp.text();
                const refName = refPath.replace(/^.*[\\\/]/, '');
                return `--- INÍCIO REFERÊNCIA: ${refName} (${refPath}) ---\n${text.trim()}\n--- FIM REFERÊNCIA: ${refName} ---`;
            }
            return null;
        });

        const results = await Promise.all(fetchPromises);
        const validContents = results.filter(Boolean);
        if (validContents.length > 0) {
            currentSkillReferences = validContents.join("\n\n");
        }
    } catch (err) {
        console.warn("[Skills] Aviso ao carregar referências da habilidade:", err);
    }
}

export async function carregarTemplatesSkill(templatesList = []) {
    currentSkillTemplates = "";
    if (!templatesList || !Array.isArray(templatesList) || templatesList.length === 0) {
        return;
    }

    try {
        const fetchPromises = templatesList.map(async (tplPath) => {
            const rawTplUrl = `https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/${tplPath}`;
            const resp = await fetchWithFallback(rawTplUrl, `skills-repo/${tplPath}`);
            if (resp.ok) {
                const text = await resp.text();
                const tplName = tplPath.replace(/^.*[\\\/]/, '');
                return `--- INÍCIO TEMPLATE: ${tplName} (${tplPath}) ---\n${text.trim()}\n--- FIM TEMPLATE: ${tplName} ---`;
            }
            return null;
        });

        const results = await Promise.all(fetchPromises);
        const validContents = results.filter(Boolean);
        if (validContents.length > 0) {
            currentSkillTemplates = validContents.join("\n\n");
        }
    } catch (err) {
        console.warn("[Skills] Aviso ao carregar templates da habilidade:", err);
    }
}

export async function buscarSkillNoGithub(skillKey) {
    if (!skillKey) skillKey = DEFAULT_SKILL_KEY;
    if (skillsConfig[skillKey]?.systemPrompt) return skillsConfig[skillKey];

    try {
        const { cached_skills = {}, skills_cache_timestamp = 0 } = await chrome.storage.local.get(['cached_skills', 'skills_cache_timestamp']);
        if ((Date.now() - skills_cache_timestamp) < SKILLS_CACHE_TTL_MS && cached_skills[skillKey]?.systemPrompt) {
            skillsConfig[skillKey] = cached_skills[skillKey];
            return skillsConfig[skillKey];
        }

        const skillMeta = skillsConfig[skillKey] || {};
        const filePath = skillMeta.file || `skills/${skillKey}/SKILL.md`;
        const resp = await fetchWithFallback(
            `https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/${filePath}`,
            `skills-repo/${filePath}`
        );

        if (resp.ok) {
            const mdText = await resp.text();
            const parsedSkill = { ...parseSkillMarkdown(mdText, skillKey), ...skillMeta };
            skillsConfig[skillKey] = parsedSkill;
            cached_skills[skillKey] = parsedSkill;
            await chrome.storage.local.set({ cached_skills, skills_cache_timestamp: Date.now() });
            return parsedSkill;
        }
    } catch (err) {
        console.warn(`[Skills] Falha ao buscar skill ${skillKey}:`, err);
    }

    return skillsConfig[skillKey] || null;
}

export async function carregarSkillsDinamicas() {
    try {
        const catResp = await fetchWithFallback(
            "https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/skills.json",
            "skills-repo/skills.json"
        );
        if (!catResp.ok) throw new Error("Catálogo de skills não encontrado.");
        const catalog = await catResp.json();
        const skills = {};

        for (const item of catalog.skills) {
            const skillId = item.slug || item.id;
            const mdResp = await fetchWithFallback(
                `https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/${item.file}`,
                `skills-repo/${item.file}`
            );
            if (mdResp.ok) {
                const mdText = await mdResp.text();
                skills[skillId] = { ...parseSkillMarkdown(mdText, skillId), ...item };
                if (item.id) skills[item.id] = skills[skillId];
            } else {
                skills[skillId] = { ...item, label: item.name };
            }
        }
        skillsConfig = skills;
        await chrome.storage.local.set({ cached_skills: skills, skills_cache_timestamp: Date.now() });
    } catch (err) {
        console.warn("[Skills] Erro ao carregar skills remotas:", err);
        const { cached_skills = {} } = await chrome.storage.local.get('cached_skills');
        skillsConfig = cached_skills;
    }
}

export async function ativarHabilidadeSelecionada(skillKey) {
    activeSkillKey = skillKey || DEFAULT_SKILL_KEY;
    const skill = await buscarSkillNoGithub(activeSkillKey);

    if (skill?.references?.length > 0) {
        await carregarReferenciasSkill(skill.references);
    } else {
        currentSkillReferences = "";
    }

    if (skill?.templates?.length > 0) {
        await carregarTemplatesSkill(skill.templates);
    } else {
        currentSkillTemplates = "";
    }

    return skill;
}

/**
 * Ativa diretamente o Validador IMGG 100 Pontos como agente único
 * Executa deterministricamente a verificação de contexto (Gestaopublicagov.br)
 */
export async function inicializarAgenteUnico() {
    const skill = await ativarHabilidadeSelecionada(DEFAULT_SKILL_KEY);
    const welcomeMsg = historyEl?.querySelector('.message.ai-msg');
    if (welcomeMsg && historyEl.children.length === 1) historyEl.innerHTML = '';

    const skillLabel = skill?.label || 'Validador IMGG 100 Pontos';

    let isPortalGestaopublicagov = false;
    let currentTabUrl = '';
    try {
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            currentTabUrl = tab?.url || '';
            if (currentTabUrl.includes('gestaoparcerias.sistema.gov.br') || currentTabUrl.includes('treinamentoparcerias.sistema.gov.br')) {
                isPortalGestaopublicagov = true;
            }
        }
    } catch (e) {
        console.warn("[Skills] Erro ao consultar aba ativa:", e);
    }

    if (isPortalGestaopublicagov) {
        // Caso 1: Usuário JÁ ESTÁ no portal Gestaopublicagov.br
        const msgTexto = `💡 **${skillLabel}**\n\nIdentifiquei que você está no ambiente **Gestaopublicagov.br**.\nVocê pode digitar sua dúvida ou comando a qualquer momento, ou utilizar um dos atalhos rápidos abaixo para iniciar a validação:`;
        const promptJson = {
            type: "interactive_prompt",
            title: "O que você deseja fazer agora?",
            options: [
                {
                    label: "📋 Validação Preliminar",
                    value: "Por favor, execute a validação preliminar do item exibido na tela ativa conforme as diretrizes do IMGG 100 Pontos.",
                    badge: "Recomendado"
                },
                {
                    label: "❓ Dúvidas do Critério",
                    value: "Explique os requisitos específicos e evidências necessárias para o critério correspondente a esta tela."
                },
                {
                    label: "💬 Consulta Livre",
                    value: "Gostaria de tirar uma dúvida geral ou analisar documentos anexados."
                }
            ]
        };
        appendMessageUI(`${msgTexto}\n\n\`\`\`json\n${JSON.stringify(promptJson, null, 2)}\n\`\`\``, 'ai-msg', false, true);
    } else {
        // Caso 2: Usuário NÃO ESTÁ no portal Gestaopublicagov.br
        const msgTexto = `💡 **${skillLabel}**\n\nIdentifiquei que você não está no portal **Gestaopublicagov.br** (\`gestaoparcerias.sistema.gov.br\` ou \`treinamentoparcerias.sistema.gov.br\`).\n\nPara validar telas e anexos em tempo real, navegue até a página desejada. Enquanto isso, fique à vontade para digitar dúvidas sobre a metodologia, critérios do IMGG ou fundamentação legal diretamente no chat.`;
        const promptJson = {
            type: "interactive_prompt",
            title: "Como deseja prosseguir?",
            options: [
                {
                    label: "🔄 Verificar Página",
                    value: "Já naveguei até a página a ser validada no portal Gestaopublicagov.br. Por favor, verifique a tela ativa e apresente as opções de validação.",
                    badge: "Recomendado"
                },
                {
                    label: "📖 Dúvidas sobre o IMGG",
                    value: "Explique a metodologia do IMGG 100 Pontos, os 7 critérios de governança pública e as regras da Portaria SEGES/MGI nº 7.383/2023."
                }
            ]
        };
        appendMessageUI(`${msgTexto}\n\n\`\`\`json\n${JSON.stringify(promptJson, null, 2)}\n\`\`\``, 'ai-msg', false, true);
    }
}

export function getActiveSkill() {
    return skillsConfig[activeSkillKey] || skillsConfig[DEFAULT_SKILL_KEY] || null;
}

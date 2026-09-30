// src/sidepanel/skills.js
import { appendMessageUI, renderSkillSelectionCard } from './ui.js';
import { historyEl } from './ui.js';

let skillsConfig = {};
export let activeSkillKey = null;

const SKILLS_CACHE_TTL_MS = 3600 * 1000;

function parseSkillMarkdown(mdText, skillId) {
    let label = skillId, category = "Geral", description = "", userGuidance = "", systemPrompt = "";
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
    } catch (e) { console.warn(`Fetch remoto falhou para ${remoteUrl}, usando fallback.`); }
    return fetch(chrome.runtime.getURL(localPath));
}

async function buscarSkillNoGithub(skillKey) {
    if (!skillKey) return null;
    if (skillsConfig[skillKey]?.systemPrompt) return skillsConfig[skillKey];
    try {
        const { cached_skills = {}, skills_cache_timestamp = 0 } = await chrome.storage.local.get(['cached_skills', 'skills_cache_timestamp']);
        if ((Date.now() - skills_cache_timestamp) < SKILLS_CACHE_TTL_MS && cached_skills[skillKey]?.systemPrompt) {
            return (skillsConfig[skillKey] = cached_skills[skillKey]);
        }
        const resp = await fetchWithFallback(`https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/skills/${skillKey}.md`, `skills-repo/skills/${skillKey}.md`);
        if (resp.ok) {
            const mdText = await resp.text();
            const parsedSkill = parseSkillMarkdown(mdText, skillKey);
            skillsConfig[skillKey] = parsedSkill;
            cached_skills[skillKey] = parsedSkill;
            await chrome.storage.local.set({ cached_skills, skills_cache_timestamp: Date.now() });
            return parsedSkill;
        }
    } catch (err) { console.warn(`Falha ao buscar skill ${skillKey}.`, err); }
    return skillsConfig[skillKey] || null;
}

export async function carregarSkillsDinamicas() {
    try {
        const catResp = await fetchWithFallback("https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/skills.json", "skills-repo/skills.json");
        if (!catResp.ok) throw new Error("Catálogo de skills não encontrado.");
        const catalog = await catResp.json();
        const skills = {};
        for (const item of catalog.skills) {
            const skillId = item.id || item.slug;
            const mdResp = await fetchWithFallback(`https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/${item.file}`, `skills-repo/${item.file}`);
            if (mdResp.ok) {
                const mdText = await mdResp.text();
                skills[skillId] = { ...parseSkillMarkdown(mdText, skillId), ...item };
            }
        }
        skillsConfig = skills;
        await chrome.storage.local.set({ cached_skills: skills, skills_cache_timestamp: Date.now() });
    } catch (err) {
        console.error("Erro ao carregar skills:", err);
        const { cached_skills = {} } = await chrome.storage.local.get('cached_skills');
        skillsConfig = cached_skills;
    }
}

export async function ativarHabilidadeSelecionada(skillKey) {
    activeSkillKey = skillKey;
    const skill = await buscarSkillNoGithub(skillKey);
    const welcomeMsg = historyEl.querySelector('.message.ai-msg');
    if (welcomeMsg && historyEl.children.length === 1) historyEl.innerHTML = '';
    const guidance = skill?.userGuidance || 'Habilidade pronta para uso.';
    appendMessageUI(`💡 **Habilidade Selecionada: ${skill?.label || skillKey}**\n\n${guidance}`, 'ai-msg');
}

export function exibirCardSelecaoHabilidade(allowedSkills = ["ALL"]) {
    if (!historyEl || historyEl.querySelector('.interactive-option-card')) return;
    const normalizedAllowed = new Set(allowedSkills.map(s => s.trim().toUpperCase()));
    const isAllAllowed = normalizedAllowed.has("ALL") || normalizedAllowed.has("*");
    const options = Object.entries(skillsConfig).map(([key, skill]) => {
        const hasPermission = isAllAllowed || normalizedAllowed.has((skill.id || key).toUpperCase()) || normalizedAllowed.has((skill.category || "").toUpperCase());
        return hasPermission ? { label: skill.label, skillKey: key } : null;
    }).filter(Boolean);
    if (options.length > 0) {
        renderSkillSelectionCard('Por favor, selecione uma habilidade:', options, ativarHabilidadeSelecionada);
    } else {
        appendMessageUI('Nenhuma habilidade disponível para seu perfil.', 'ai-msg');
    }
}

export function getActiveSkill() {
    return activeSkillKey ? skillsConfig[activeSkillKey] : null;
}

#!/usr/bin/env node
/**
 * Release build script for Algomind Extension
 *
 * 1. Runs TypeScript compilation
 * 2. Copies static assets into dist/
 * 3. Strips dev-only host_permissions from manifest.json
 * 4. Produces dist/ ready for zipping and a release zip in releases/
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const RELEASES = path.join(ROOT, 'releases')

function main() {
    console.log('🔨  Running TypeScript build...')
    execSync('npx tsc', { stdio: 'inherit', cwd: ROOT })

    console.log('📦  Copying static assets...')
    if (!fs.existsSync(DIST)) {
        fs.mkdirSync(DIST, { recursive: true })
    }
    for (const file of ['popup.html', 'options.html', 'styles.css', 'manifest.json']) {
        fs.copyFileSync(path.join(ROOT, file), path.join(DIST, file))
    }
    if (fs.existsSync(path.join(ROOT, 'public'))) {
        fs.cpSync(path.join(ROOT, 'public'), DIST, { recursive: true, force: true })
    }

    console.log('🧹  Stripping dev-only permissions from manifest...')
    const manifestPath = path.join(DIST, 'manifest.json')
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

    // Remove localhost from host_permissions for release
    manifest.host_permissions = (manifest.host_permissions || []).filter(
        (h) => !h.includes('localhost'),
    )

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

    console.log('✅  Release manifest written:')
    console.log('   permissions:', manifest.permissions)
    console.log('   host_permissions:', manifest.host_permissions)

    console.log('🗜️   Creating release zip...')
    if (!fs.existsSync(RELEASES)) {
        fs.mkdirSync(RELEASES, { recursive: true })
    }
    const version = manifest.version
    const zipName = `algomind-extension-v${version}.zip`
    const zipPath = path.join(RELEASES, zipName)

    // Use zip command on Unix, or node-archiver fallback could be added
    try {
        execSync(`cd ${DIST} && zip -r "${zipPath}" .`, { stdio: 'inherit' })
    } catch {
        console.error('❌  Failed to create zip. Make sure `zip` is installed.')
        process.exit(1)
    }

    console.log(`\n🎉  Release ready: ${zipPath}`)
    console.log(`   Upload this zip to the Chrome Web Store.`)
}

main()

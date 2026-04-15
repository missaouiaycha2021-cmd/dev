pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        BACKEND_IMAGE   = "aycha123/mon-dashboard-backend"
        FRONTEND_IMAGE  = "aycha123/mon-dashboard-frontend"
        IMAGE_TAG       = "v${BUILD_NUMBER}"
        GIT_COMMIT_MESSAGE = "chore: automatic update after successful build [skip ci]"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Tools') {
            steps {
                sh '''
                    echo "=== Checking tools versions ==="
                    python3 --version || true
                    node --version || true
                    docker --version || true
                    docker compose version || true
                '''
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'pip install -r requirements.txt --break-system-packages || true'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh '''
                                export NVM_DIR="$HOME/.nvm"
                                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                                nvm install 20 --no-install-recommends || true
                                nvm use 20
                                npm ci
                            '''
                        }
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh '''
                        export NVM_DIR="$HOME/.nvm"
                        . "$NVM_DIR/nvm.sh"
                        nvm use 20
                        npm run build
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Backend') {
                    steps {
                        sh 'docker build -t $BACKEND_IMAGE:$IMAGE_TAG -t $BACKEND_IMAGE:latest backend/'
                    }
                }
                stage('Frontend') {
                    steps {
                        sh 'docker build -t $FRONTEND_IMAGE:$IMAGE_TAG -t $FRONTEND_IMAGE:latest frontend/'
                    }
                }
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh 'echo $PASS | docker login -u $USER --password-stdin'
                }
            }
        }

        stage('Push Images') {
            parallel {
                stage('Backend') {
                    steps {
                        sh 'docker push $BACKEND_IMAGE:$IMAGE_TAG && docker push $BACKEND_IMAGE:latest'
                    }
                }
                stage('Frontend') {
                    steps {
                        sh 'docker push $FRONTEND_IMAGE:$IMAGE_TAG && docker push $FRONTEND_IMAGE:latest'
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    echo "=== Pulling latest images ==="
                    docker compose pull || true
                    echo "=== Stopping old containers ==="
                    docker compose down --remove-orphans || true
                    echo "=== Starting new containers ==="
                    docker compose up -d --force-recreate
                    echo "=== Cleaning unused images ==="
                    docker image prune -f
                '''
            }
        }

        // ==================== STAGE AUTO COMMIT & PUSH (CORRIGÉ) ====================
                // ==================== STAGE AUTO COMMIT & PUSH (VERSION FIXÉE) ====================
        stage('Commit & Push to GitHub') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                script {
                    withCredentials([gitUsernamePassword(credentialsId: 'github-credentials', gitToolName: 'Default')]) {
                        sh '''
                            git config user.name "Jenkins CI"
                            git config user.email "jenkins@aycha123.com"

                            echo "=== Recherche des modifications (HTML + fichiers générés) ==="

                            # 1. Mise à jour du fichier VERSION (garantit qu'il y a toujours au moins 1 changement)
                            echo "v${BUILD_NUMBER} - $(date '+%Y-%m-%d %H:%M:%S')" > VERSION

                            # 2. Ajoute les fichiers de base
                            git add VERSION docker-compose.yml README.md || true

                            # 3. Ajoute explicitement tous les fichiers .html (récursif)
                            git add $(find . -name "*.html" -type f) || true

                            # 4. Ajoute le dossier de build du frontend (le plus important pour apple-fr.html)
                            git add frontend/dist/ frontend/build/ || true

                            # 5. Force l'ajout même si dans .gitignore (à utiliser avec prudence)
                            # git add --force frontend/dist/ || true

                            # Vérification finale
                            if git diff --cached --quiet; then
                                echo "ℹ️ Aucun changement détecté par Jenkins"
                                echo "   → Vérifie que le fichier apple-fr.html n'est pas dans .gitignore"
                            else
                                git commit -m "${GIT_COMMIT_MESSAGE}"
                                git push
                                echo "✅ Succès : Nouveaux fichiers (HTML inclus) poussés automatiquement vers GitHub"
                            fi
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo '✅ CI/CD Pipeline SUCCESS → Version + fichiers HTML poussés sur GitHub 🚀'
        }
        failure {
            echo '❌ CI/CD Pipeline FAILED → Aucun push effectué'
        }
        always {
            sh 'docker logout || true'
            cleanWs()
        }
    }
}
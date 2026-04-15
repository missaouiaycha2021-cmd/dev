pipeline {
    agent any

    triggers {
        githubPush()   // Déclenchement automatique sur push GitHub
    }

    environment {
        BACKEND_IMAGE  = "aycha123/mon-dashboard-backend"
        FRONTEND_IMAGE = "aycha123/mon-dashboard-frontend"
        IMAGE_TAG      = "v${BUILD_NUMBER}"
        
        // Pour éviter la boucle infinie
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
                    sh '''
                        echo $PASS | docker login -u $USER --password-stdin
                    '''
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

        // ==================== NOUVEAU STAGE : Push automatique après succès ====================
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

                            echo "=== Checking for changes to commit ==="

                            # Liste les fichiers que tu veux éventuellement pousser
                            git add docker-compose.yml README.md .env.example || true

                            # Vérification propre : y a-t-il vraiment des modifications ?
                            if git diff --cached --quiet; then
                                echo "ℹ️ Aucun changement détecté → rien à commiter ni pousser"
                            else
                                git commit -m "chore: automatic update after successful Jenkins build [skip ci]"
                                git push --porcelain
                                echo "✅ Changements poussés automatiquement vers GitHub"
                            fi
                        '''
                    }
                }
            }
        }
    
    post {
        success {
            echo '✅ CI/CD Pipeline SUCCESS → Changements poussés sur GitHub 🚀'
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